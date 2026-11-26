-- ============================================================================
-- Premium permanent du compte fondateur — Le Code Masculin
-- Écrit le 2026-11-25 à partir du diagnostic réel de la base et du backend
-- lcm-backend 26a4078. À lancer en une fois dans le SQL Editor (une seule
-- transaction : si une ligne échoue, rien n'est appliqué). Rejouable.
--
-- POURQUOI UN VERROU
-- Le Premium est lu à deux endroits, qu'il faut protéger tous les deux :
--   - entitlements.status ('active' / 'trialing') : RLS de la communauté
--     (has_active_entitlement), quota du coach (backend quota.js),
--     /api/entitlement-status (Bibliothèque de l'app) ;
--   - ai_quota.is_premium : l'app (Coach, Communauté, Mandala, Tracker). Si
--     is_premium est faux et messages_used >= 10, l'app bloque le coach
--     elle-même, sans appeler le serveur.
-- Plusieurs écritures automatiques pourraient retirer ce Premium :
-- provision-account (upsert, statut 'inactive' sans abonnement), link-account
-- (upsert avec les données Stripe), grant-access (ajoute une date de fin),
-- update-entitlement (par client Stripe), expire_fixed_term_access (statut
-- 'expired' et is_premium = false), syncAiQuotaPremium(false).
--
-- LE VERROU
-- Deux déclencheurs BEFORE INSERT OR UPDATE, sur entitlements et sur ai_quota.
-- Pour toute ligne d'un compte dont profiles.is_founder = true :
--   - entitlements est ramenée à status = 'active', plan_type = 'fondateur',
--     sans trial_ends_at, sans access_expires_at, sans identifiant Stripe ;
--   - ai_quota garde is_premium = true (messages_used n'est pas touché : le
--     serveur ne compte pas les messages d'un compte Premium).
-- L'écriture n'est pas refusée mais corrigée : les routes du backend et les
-- scénarios Make ne tombent pas en erreur sur le compte fondateur. Sans
-- identifiant Stripe, update-entitlement ne trouve d'ailleurs jamais sa ligne,
-- et sans date de fin expire_fixed_term_access ne la sélectionne pas.
--
-- Le verrou suit profiles.is_founder : il s'applique à tout compte fondateur
-- et cesse si is_founder repasse à false (l'entitlement reste alors tel quel).
-- is_founder devient donc un privilège : il ne doit JAMAIS être modifiable par
-- l'app (aujourd'hui : pas de politique d'écriture, UPDATE retiré à anon et
-- authenticated sur profiles).
--
-- entitlements.purchase_email est NOT NULL : le script exige un email pour chaque
-- fondateur, et le verrou remplit purchase_email avec l'email du compte si une
-- écriture le laisse vide.
--
-- Vérification après application : voir la requête en fin de fichier.
-- Retour arrière : supprimer les deux déclencheurs et les deux fonctions
-- (drop trigger … ; drop function …). L'entitlement du fondateur reste actif.
-- ============================================================================

begin;

-- ---------------------------------------------------------------- 1. garde-fou
do $$
begin
  if not exists (select 1 from auth.users u join public.profiles p on p.id = u.id where p.is_founder) then
    raise exception 'ARRÊT : aucun compte fondateur (profiles.is_founder = true). Rien n''a été modifié.';
  end if;
  -- entitlements.purchase_email est NOT NULL : il faut un email pour chaque fondateur.
  if exists (select 1 from auth.users u join public.profiles p on p.id = u.id
             where p.is_founder
               and coalesce(nullif(btrim(u.email), ''), nullif(btrim(p.email), '')) is null) then
    raise exception 'ARRÊT : un compte fondateur n''a pas d''email (auth.users et profiles). Rien n''a été modifié.';
  end if;
end $$;

-- ---------------------------------------------------------------- 2. verrou entitlements
create or replace function public.lock_founder_entitlement()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  v_email text;
begin
  -- Email du compte (auth.users, sinon profiles) : sert si l'écriture n'en fournit pas.
  select coalesce(nullif(lower(btrim(u.email)), ''), nullif(lower(btrim(p.email)), ''))
    into v_email
  from public.profiles p
  left join auth.users u on u.id = p.id
  where p.id = new.supabase_user_id and p.is_founder;

  if found then
    -- purchase_email est NOT NULL : jamais vide pour un fondateur.
    if new.purchase_email is null or btrim(new.purchase_email) = '' then
      new.purchase_email := v_email;
    end if;
    new.status                 := 'active';
    new.plan_type              := 'fondateur';
    new.trial_ends_at          := null;
    new.access_expires_at      := null;
    new.stripe_customer_id     := null;
    new.stripe_subscription_id := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_lock_founder_entitlement on public.entitlements;
create trigger trg_lock_founder_entitlement
  before insert or update on public.entitlements
  for each row execute function public.lock_founder_entitlement();

-- ---------------------------------------------------------------- 3. verrou ai_quota
create or replace function public.lock_founder_quota()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
begin
  if exists (select 1 from public.profiles p where p.id = new.user_id and p.is_founder) then
    new.is_premium := true;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_lock_founder_quota on public.ai_quota;
create trigger trg_lock_founder_quota
  before insert or update on public.ai_quota
  for each row execute function public.lock_founder_quota();

-- Fonctions de déclencheur : personne ne doit pouvoir les appeler directement.
revoke execute on function public.lock_founder_entitlement(), public.lock_founder_quota()
  from public, anon, authenticated;

-- ---------------------------------------------------------------- 4. droits du ou des fondateurs
insert into public.entitlements
  (supabase_user_id, purchase_email, status, plan_type, trial_ends_at, access_expires_at,
   stripe_customer_id, stripe_subscription_id, updated_at)
select u.id,
       coalesce(nullif(lower(btrim(u.email)), ''), nullif(lower(btrim(p.email)), '')),
       'active', 'fondateur', null, null, null, null, now()
from auth.users u
join public.profiles p on p.id = u.id
where p.is_founder
on conflict (supabase_user_id) do update
  set purchase_email = coalesce(nullif(btrim(public.entitlements.purchase_email), ''), excluded.purchase_email),
      status = 'active', plan_type = 'fondateur', trial_ends_at = null, access_expires_at = null,
      stripe_customer_id = null, stripe_subscription_id = null, updated_at = now();

insert into public.ai_quota (user_id, is_premium, updated_at)
select u.id, true, now()
from auth.users u
join public.profiles p on p.id = u.id
where p.is_founder
on conflict (user_id) do update set is_premium = true, updated_at = now();

commit;

-- ---------------------------------------------------------------- vérification
-- Toutes les colonnes ok_… doivent valoir true.
-- select u.email, e.status, e.plan_type, e.access_expires_at, e.stripe_customer_id, q.is_premium,
--        (e.status = 'active' and e.access_expires_at is null and e.trial_ends_at is null
--           and e.stripe_customer_id is null and e.stripe_subscription_id is null) as ok_entitlement,
--        coalesce(q.is_premium, false)                                            as ok_quota,
--        -- condition de has_active_entitlement (la fonction renvoie NULL sans session) :
--        coalesce(e.status in ('trialing', 'active'), false)                      as ok_acces_communaute,
--        exists (select 1 from pg_trigger where tgname = 'trg_lock_founder_entitlement') as ok_verrou_entitlement,
--        exists (select 1 from pg_trigger where tgname = 'trg_lock_founder_quota')       as ok_verrou_quota
-- from auth.users u
-- join public.profiles p          on p.id = u.id
-- left join public.entitlements e on e.supabase_user_id = u.id
-- left join public.ai_quota     q on q.user_id = u.id
-- where p.is_founder;
