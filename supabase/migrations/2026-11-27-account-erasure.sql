-- ============================================================================
-- Effacement des comptes — Le Code Masculin — 2026-11-27
-- Écrit à partir de l'étape 0 (lecture seule) lancée sur la base réelle.
-- À appliquer APRÈS 2026-11-27-past-due-premium.sql (le Premium y inclut past_due)
-- et AVEC le déploiement backend feat/account-erasure.
--
-- CE QUE FAIT CE SCRIPT (étape 1, une seule transaction)
--   1. Clés étrangères en NO ACTION vers auth.users (daily_activity,
--      lesson_completions, pacte_entries, diagnostic_results) → CASCADE.
--      entitlements reste en NO ACTION : la fonction d'effacement l'efface
--      elle-même, une ligne oubliée fait échouer l'effacement au lieu de rester.
--   2. Communauté : user_id nullable et ON DELETE SET NULL sur les posts et les
--      réponses (anonymisation au lieu de suppression) ; vues en jointure gauche
--      avec « Membre supprimé ».
--   3. Suivi de l'inactivité : profiles.last_seen_at, dates d'avertissement,
--      entitlements.access_ended_at (posée et remise à zéro par un déclencheur).
--   4. Journal account_erasures (preuve d'effacement, reprise des étapes externes).
--   5. Fonctions réservées à la clé service : refresh_last_seen,
--      retention_candidates, erase_user_data.
--
-- RÈGLE DE CONSERVATION (décision du 2026-11-27) : effacement après 6 mois sans
-- connexion ET sans abonnement actif, avertissements J-30 et J-7 avant. Les
-- dates sont calculées ici ; la décision d'envoyer ou d'effacer est prise par le
-- backend (src/retention.js), testée.
--
-- Le compte fondateur n'est jamais concerné : exclu de retention_candidates et
-- refusé par erase_user_data.
--
-- Vérification : étape 2. Retour arrière : 2026-11-27-account-erasure-ROLLBACK.sql.
-- ============================================================================


-- ---------------------------------------------------------------- ÉTAPE 1
begin;

-- Garde-fou : les contraintes à modifier portent bien les noms vus à l'étape 0.
do $$
declare
  missing text;
begin
  select string_agg(n, ', ') into missing
  from unnest(array['daily_activity_user_id_fkey', 'lesson_completions_user_id_fkey',
                    'pacte_entries_user_id_fkey', 'diagnostic_results_user_id_fkey',
                    'community_posts_user_id_fkey', 'community_replies_user_id_fkey']) as n
  where not exists (select 1 from pg_constraint c where c.conname = n and c.contype = 'f');
  if missing is not null then
    raise exception 'ARRÊT : contrainte(s) introuvable(s) : %. Rien n''a été modifié.', missing;
  end if;
end $$;

-- ---------------------------------------------------------------- 1. clés étrangères
alter table public.daily_activity
  drop constraint daily_activity_user_id_fkey,
  add constraint daily_activity_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade;
alter table public.lesson_completions
  drop constraint lesson_completions_user_id_fkey,
  add constraint lesson_completions_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade;
alter table public.pacte_entries
  drop constraint pacte_entries_user_id_fkey,
  add constraint pacte_entries_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade;
alter table public.diagnostic_results
  drop constraint diagnostic_results_user_id_fkey,
  add constraint diagnostic_results_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade;

-- ---------------------------------------------------------------- 2. communauté
alter table public.community_posts
  alter column user_id drop not null,
  drop constraint community_posts_user_id_fkey,
  add constraint community_posts_user_id_fkey foreign key (user_id) references auth.users (id) on delete set null;
alter table public.community_replies
  alter column user_id drop not null,
  drop constraint community_replies_user_id_fkey,
  add constraint community_replies_user_id_fkey foreign key (user_id) references auth.users (id) on delete set null;

-- Vues : même définition qu'à l'étape 4 de 2026-11-25-security-hardening.sql,
-- sauf la jointure gauche (un post anonymisé n'a plus de profil).
drop view public.community_replies_view;
drop view public.community_posts_view;

create view public.community_posts_view
with (security_invoker = false, security_barrier = true) as
select p.id,
       coalesce(pr.pseudonym, 'Membre supprimé') as pseudonym,
       coalesce(pr.is_founder, false) as is_founder,
       p.pillar_tag,
       p.content,
       p.created_at,
       p.is_hidden,
       (select count(*)
          from public.community_replies r
         where r.post_id = p.id and r.is_hidden = false) as reply_count,
       coalesce(p.user_id = auth.uid(), false) as is_mine
from public.community_posts p
left join public.profiles pr on pr.id = p.user_id
where public.has_active_entitlement(auth.uid())
  and (p.is_hidden = false or p.user_id = auth.uid());

comment on view public.community_posts_view is
  'Droits du propriétaire volontaires : lit les pseudonymes des autres membres sans exposer profiles. Le WHERE reproduit la politique posts_select. Auteur effacé : « Membre supprimé ». Ne jamais exposer user_id.';

create view public.community_replies_view
with (security_invoker = false, security_barrier = true) as
select r.id,
       r.post_id,
       coalesce(pr.pseudonym, 'Membre supprimé') as pseudonym,
       coalesce(pr.is_founder, false) as is_founder,
       r.content,
       r.created_at,
       r.is_hidden,
       coalesce(r.user_id = auth.uid(), false) as is_mine
from public.community_replies r
left join public.profiles pr on pr.id = r.user_id
where public.has_active_entitlement(auth.uid())
  and (r.is_hidden = false or r.user_id = auth.uid());

comment on view public.community_replies_view is
  'Droits du propriétaire volontaires : lit les pseudonymes des autres membres sans exposer profiles. Le WHERE reproduit la politique replies_select. Auteur effacé : « Membre supprimé ». Ne jamais exposer user_id.';

revoke all on public.community_posts_view from public, anon, authenticated;
revoke all on public.community_replies_view from public, anon, authenticated;
grant select on public.community_posts_view to authenticated;
grant select on public.community_replies_view to authenticated;

-- ---------------------------------------------------------------- 3. inactivité et fin d'accès
alter table public.profiles
  add column if not exists last_seen_at timestamptz,
  add column if not exists erasure_warn30_sent_at timestamptz,
  add column if not exists erasure_warn7_sent_at timestamptz;

alter table public.entitlements
  add column if not exists access_ended_at timestamptz;

-- Fin d'accès : posée quand le statut quitte le Premium, gardée tant qu'il n'y
-- revient pas, remise à zéro au réabonnement. Couvre toutes les écritures
-- (backend, expire_fixed_term_access, Make). Le nom du déclencheur le fait passer
-- APRÈS trg_lock_founder_entitlement (ordre alphabétique) : le fondateur, ramené
-- à 'active' par son verrou, garde une date vide.
create or replace function public.track_access_end()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
begin
  if new.status in ('trialing', 'active', 'past_due')
     and (new.access_expires_at is null or new.access_expires_at > now()) then
    new.access_ended_at := null;
  else
    new.access_ended_at := coalesce(case when tg_op = 'UPDATE' then old.access_ended_at end, now());
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_track_access_end on public.entitlements;
create trigger trg_track_access_end
  before insert or update on public.entitlements
  for each row execute function public.track_access_end();

-- Comptes déjà sans accès : leurs 6 mois commencent aujourd'hui.
update public.entitlements
   set access_ended_at = now()
 where access_ended_at is null
   and not (status in ('trialing', 'active', 'past_due')
            and (access_expires_at is null or access_expires_at > now()));

-- ---------------------------------------------------------------- 4. journal
create table if not exists public.account_erasures (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null,       -- pas de clé étrangère : le compte n'existe plus
  reason               text not null check (reason in ('user_request', 'retention_expired')),
  erase_community_text boolean not null,
  email                text,                -- sert aux étapes externes, effacé à la fin
  requested_at         timestamptz not null default now(),
  supabase_erased_at   timestamptz,
  wordpress_done_at    timestamptz,
  brevo_done_at        timestamptz,
  completed_at         timestamptz,
  attempts             integer not null default 0,
  last_error           text
);
-- Un seul effacement en cours par compte.
create unique index if not exists account_erasures_one_open
  on public.account_erasures (user_id) where completed_at is null;

alter table public.account_erasures enable row level security;  -- aucune politique : clé service seulement
revoke all on public.account_erasures from public, anon, authenticated;

-- ---------------------------------------------------------------- 5. fonctions (clé service)

-- Dernière activité : avec la connexion conservée, l'app rafraîchit sa session
-- sans que auth.users.last_sign_in_at bouge. On garde ici la plus récente des
-- traces connues, une fois par jour (tâche Make), pour qu'elle survive au
-- nettoyage des sessions par Supabase.
create or replace function public.refresh_last_seen()
returns integer
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  n integer;
begin
  with activity as (
    select u.id,
           greatest(
             u.last_sign_in_at,
             (select max(s.refreshed_at) at time zone 'UTC' from auth.sessions s where s.user_id = u.id),
             (select max(s.updated_at) from auth.sessions s where s.user_id = u.id),
             (select max(r.updated_at) from auth.refresh_tokens r where r.user_id = u.id::text),
             (select max(d.activity_date)::timestamp at time zone 'UTC' from public.daily_activity d where d.user_id = u.id)
           ) as seen
    from auth.users u
  )
  update public.profiles p
     set last_seen_at = a.seen
    from activity a
   where p.id = a.id
     and a.seen is not null
     and (p.last_seen_at is null or a.seen > p.last_seen_at);
  get diagnostics n = row_count;
  return n;
end;
$function$;

-- Comptes dont l'effacement tombe dans les p_horizon prochains jours (ou est
-- dépassé) : sans abonnement actif, hors fondateur. Ne décide rien.
create or replace function public.retention_candidates(p_horizon interval default interval '31 days')
returns table (
  user_id          uuid,
  email            text,
  prenom           text,
  last_activity_at timestamptz,
  erase_after      timestamptz,
  warn30_sent_at   timestamptz,
  warn7_sent_at    timestamptz
)
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
as $function$
  with base as (
    select p.id,
           coalesce(nullif(lower(btrim(u.email)), ''), nullif(lower(btrim(p.email)), '')) as email,
           p.prenom,
           greatest(p.last_seen_at, u.last_sign_in_at, u.created_at, e.access_ended_at) as last_activity_at,
           p.erasure_warn30_sent_at,
           p.erasure_warn7_sent_at
    from public.profiles p
    join auth.users u on u.id = p.id
    left join public.entitlements e on e.supabase_user_id = p.id
    where not p.is_founder
      and not exists (
        select 1 from public.entitlements a
        where a.supabase_user_id = p.id
          and a.status in ('trialing', 'active', 'past_due')
          and (a.access_expires_at is null or a.access_expires_at > now())
      )
  )
  select id, email, prenom, last_activity_at, last_activity_at + interval '6 months',
         erasure_warn30_sent_at, erasure_warn7_sent_at
  from base
  where last_activity_at + interval '6 months' - p_horizon <= now()
  order by last_activity_at;
$function$;

-- LA procédure d'effacement côté base (suppression immédiate ET fin de
-- conservation). Tout ou rien : une seule transaction. Le compte auth est
-- effacé en dernier, dans la même transaction.
create or replace function public.erase_user_data(p_user_id uuid, p_erase_community_text boolean)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  result jsonb := '{}'::jsonb;
  n integer;
  t text;
begin
  if p_user_id is null then
    raise exception 'user_id requis';
  end if;
  if exists (select 1 from public.profiles where id = p_user_id and is_founder) then
    raise exception 'founder_protected';
  end if;

  -- Communauté : anonymisée, jamais supprimée.
  update public.community_posts
     set user_id = null,
         content = case when p_erase_community_text then 'Message supprimé' else content end
   where user_id = p_user_id;
  get diagnostics n = row_count;  result := result || jsonb_build_object('community_posts', n);

  update public.community_replies
     set user_id = null,
         content = case when p_erase_community_text then 'Message supprimé' else content end
   where user_id = p_user_id;
  get diagnostics n = row_count;  result := result || jsonb_build_object('community_replies', n);

  delete from public.community_reports where reporter_id = p_user_id;
  get diagnostics n = row_count;  result := result || jsonb_build_object('community_reports', n);

  -- Tables personnelles (liste de l'étape 0). Effacées explicitement, sans
  -- dépendre des cascades. ORDRE : une table qui en référence une autre de la
  -- liste passe AVANT elle (ex. user_mandala → diagnostic_results).
  -- Clés vérifiées par supabase/checks/personal-table-fks.sql et par le test
  -- supabase/__tests__/eraseOrder.test.ts.
  foreach t in array array[
    'user_mandala', 'user_pillar_priority', 'weekly_commitments', 'weekly_reviews',
    'journal_entries', 'pacte_entries', 'diagnostic_results', 'conversations',
    'daily_activity', 'lesson_completions', 'user_progress', 'streaks',
    'tracker_entries', 'tracker_settings', 'ai_quota'
  ] loop
    execute format('delete from public.%I where user_id = $1', t) using p_user_id;
    get diagnostics n = row_count;
    result := result || jsonb_build_object(t, n);
  end loop;

  delete from public.entitlements where supabase_user_id = p_user_id;
  get diagnostics n = row_count;  result := result || jsonb_build_object('entitlements', n);

  delete from public.profiles where id = p_user_id;
  get diagnostics n = row_count;  result := result || jsonb_build_object('profiles', n);

  -- En dernier : identités, sessions et jetons partent par cascade (schéma auth).
  delete from auth.users where id = p_user_id;
  get diagnostics n = row_count;  result := result || jsonb_build_object('auth_users', n);

  return result;
end;
$function$;

revoke execute on function public.track_access_end() from public, anon, authenticated;
revoke execute on function public.refresh_last_seen() from public, anon, authenticated;
revoke execute on function public.retention_candidates(interval) from public, anon, authenticated;
revoke execute on function public.erase_user_data(uuid, boolean) from public, anon, authenticated;
grant execute on function public.refresh_last_seen() to service_role;
grant execute on function public.retention_candidates(interval) to service_role;
grant execute on function public.erase_user_data(uuid, boolean) to service_role;

-- Première mesure de l'activité.
select public.refresh_last_seen();

commit;


-- ---------------------------------------------------------------- ÉTAPE 2 (vérification, lecture seule)
-- 2a. Règles ON DELETE (attendu : les 4 en CASCADE, posts/réponses en SET NULL,
--     entitlements toujours NO ACTION).
-- select con.conrelid::regclass, con.conname, con.confdeltype
-- from pg_constraint con
-- where con.contype = 'f' and con.confrelid = 'auth.users'::regclass and con.connamespace = 'public'::regnamespace
-- order by 1;
--
-- 2b. Droits (attendu : anon=false, auth=false sur les 3 fonctions).
-- select p.proname, has_function_privilege('anon', p.oid, 'execute') as anon,
--        has_function_privilege('authenticated', p.oid, 'execute') as auth
-- from pg_proc p where p.pronamespace = 'public'::regnamespace
--   and p.proname in ('refresh_last_seen', 'retention_candidates', 'erase_user_data');
--
-- 2c. Fin d'accès et activité (nombres seulement ; attendu : fondateur sans date).
-- select count(*) filter (where access_ended_at is not null) as avec_fin_acces,
--        count(*) filter (where access_ended_at is null) as sans_fin_acces
-- from public.entitlements;
-- select count(*) filter (where last_seen_at is not null) as avec_activite from public.profiles;
--
-- 2d. Candidats dans 7 mois (attendu aujourd'hui : aucun compte effaçable).
-- select user_id, last_activity_at, erase_after from public.retention_candidates(interval '7 months');
--
-- 2e. App (compte Premium) : la Communauté affiche les mêmes posts qu'avant.


-- ---------------------------------------------------------------- ÉTAPE R (retour arrière)
-- Fichier séparé : 2026-11-27-account-erasure-ROLLBACK.sql
