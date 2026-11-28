-- ============================================================================
-- Retard de paiement (past_due) : le Premium est gardé — Le Code Masculin
-- Écrit le 2026-11-27, à appliquer AVEC le déploiement backend
-- feat/past-due-premium (src/billingStatus.js : trialing, active, past_due).
--
-- POURQUOI
-- La formation WordPress n'est suspendue qu'à canceled, unpaid, paused ou
-- incomplete_expired. L'app retirait déjà le Premium à past_due. Désormais
-- l'app et la formation s'arrêtent au même moment.
--
-- CE QUI CHANGE
--   1. has_active_entitlement accepte past_due. Les 4 politiques de la
--      communauté (posts_select, posts_insert, replies_select, replies_insert)
--      et les vues community_posts_view / community_replies_view l'appellent :
--      elles suivent sans être modifiées.
--   2. ai_quota.is_premium remis à true pour les comptes DÉJÀ en past_due,
--      que le backend avait passés à false (l'app lit cette colonne).
-- CE QUI NE CHANGE PAS
--   - Le verrou fondateur (lock_founder_entitlement / lock_founder_quota)
--     impose status = 'active' : il n'est pas concerné.
--   - Le contrôle d'accès reste réservé à l'appelant (p_user_id = auth.uid()).
--
-- ORDRE : étape 0 (lecture seule, me montrer le résultat si une ligne surprend),
-- puis étape 1 en une fois. Retour arrière : 2026-11-27-past-due-premium-ROLLBACK.sql.
-- ============================================================================


-- ---------------------------------------------------------------- ÉTAPE 0 (lecture seule)

-- 0a. Tout objet qui compare entitlements.status à une liste écrite en dur
--     (en dehors de has_active_entitlement). Attendu : aucune ligne, ou
--     seulement expire_fixed_term_access (voir 0b) et les deux verrous fondateur.
select 'politique' as type, schemaname || '.' || tablename || ' / ' || policyname as objet,
       coalesce('USING ' || qual, '') || coalesce(' CHECK ' || with_check, '') as definition
from pg_policies
where coalesce(qual, '') ~* 'trialing|past_due'
   or coalesce(with_check, '') ~* 'trialing|past_due'
union all
select 'fonction', p.oid::regprocedure::text, p.prosrc
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prosrc ~* 'trialing' and p.proname <> 'has_active_entitlement'
union all
select 'vue', c.oid::regclass::text, pg_get_viewdef(c.oid, true)
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('v', 'm') and pg_get_viewdef(c.oid, true) ~* 'trialing'
order by 1, 2;

-- 0b. expire_fixed_term_access : quels statuts fait-elle expirer ? Si elle ne
--     sélectionne que ('trialing', 'active'), un accès La Transmission passé en
--     past_due ne serait jamais expiré : me montrer sa définition dans ce cas.
select pg_get_functiondef(p.oid)
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'expire_fixed_term_access';

-- 0c. Comptes concernés par l'étape 1b (past_due, sans date de fin dépassée).
select e.supabase_user_id, e.status, e.access_expires_at, q.is_premium
from public.entitlements e
left join public.ai_quota q on q.user_id = e.supabase_user_id
where e.status = 'past_due'
  and (e.access_expires_at is null or e.access_expires_at > now());


-- ---------------------------------------------------------------- ÉTAPE 1
begin;

-- 1a. Même liste que le backend (src/billingStatus.js PREMIUM_STATUSES).
create or replace function public.has_active_entitlement(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
as $function$
  select (p_user_id = auth.uid() or coalesce(auth.role(), '') = 'service_role')
     and exists (
       select 1 from public.entitlements e
       where e.supabase_user_id = p_user_id
         and e.status in ('trialing', 'active', 'past_due')
     );
$function$;

-- create or replace garde les droits ; on les réaffirme quand même.
revoke execute on function public.has_active_entitlement(uuid) from public, anon;
grant execute on function public.has_active_entitlement(uuid) to authenticated, service_role;

-- 1b. Accès à durée fixe (La Transmission) : la tâche d'expiration prend aussi
--     past_due. Le backend n'écrit plus past_due sur un accès à durée fixe en cours,
--     ceci couvre une ligne qui le serait quand même. Seul changement : la liste des statuts.
create or replace function public.expire_fixed_term_access()
returns integer
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  nb_expires integer;
begin
  with expired as (
    update public.entitlements
       set status = 'expired',
           updated_at = now()
     where access_expires_at is not null
       and access_expires_at < now()
       and status in ('active', 'trialing', 'past_due')
    returning supabase_user_id
  ),
  quota as (
    update public.ai_quota q
       set is_premium = false,
           updated_at = now()
      from expired e
     where q.user_id = e.supabase_user_id
    returning q.user_id
  )
  select count(*) into nb_expires from expired;

  return nb_expires;
end;
$function$;

-- 1c. Comptes déjà en past_due : Premium rendu dans l'app.
insert into public.ai_quota (user_id, is_premium, updated_at)
select e.supabase_user_id, true, now()
from public.entitlements e
where e.status = 'past_due'
  and (e.access_expires_at is null or e.access_expires_at > now())
on conflict (user_id) do update set is_premium = true, updated_at = now();

commit;

-- Vérification (attendu : la définition contient 'past_due' ; anon=false, auth=true) :
-- select pg_get_functiondef('public.has_active_entitlement(uuid)'::regprocedure);
-- select has_function_privilege('anon', 'public.has_active_entitlement(uuid)', 'execute') as anon,
--        has_function_privilege('authenticated', 'public.has_active_entitlement(uuid)', 'execute') as auth;


-- ---------------------------------------------------------------- ÉTAPE R (retour arrière)
-- Fichier séparé : 2026-11-27-past-due-premium-ROLLBACK.sql
