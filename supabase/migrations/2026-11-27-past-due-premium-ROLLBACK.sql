-- ============================================================================
-- RETOUR ARRIÈRE de 2026-11-27-past-due-premium.sql — Le Code Masculin
-- À lancer APRÈS le retour arrière de 2026-11-27-account-erasure.sql s'il a été
-- appliqué (ordre inverse de l'application), et avec le retour arrière du
-- backend (feat/past-due-premium retiré).
--
-- CE QUI EST DÉFAIT
--   - has_active_entitlement redevient ('trialing', 'active') : un membre en
--     past_due perd l'accès à la communauté.
-- CE QUI EST GARDÉ
--   - expire_fixed_term_access garde past_due dans sa liste : sans effet si plus
--     rien n'écrit past_due sur un accès à durée fixe, et plus sûr ;
--   - ai_quota.is_premium n'est pas remis à false : le prochain événement Stripe
--     de chaque compte le resynchronise.
-- ============================================================================

begin;

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
         and e.status in ('trialing', 'active')
     );
$function$;

revoke execute on function public.has_active_entitlement(uuid) from public, anon;
grant execute on function public.has_active_entitlement(uuid) to authenticated, service_role;

commit;

-- Vérification (attendu : la définition ne contient plus 'past_due') :
-- select pg_get_functiondef('public.has_active_entitlement(uuid)'::regprocedure);
