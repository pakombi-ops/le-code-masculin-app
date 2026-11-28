-- ============================================================================
-- RETOUR ARRIÈRE de 2026-11-27-account-erasure.sql — Le Code Masculin
-- À lancer AVANT le retour arrière de 2026-11-27-past-due-premium.sql
-- (ordre inverse de l'application), et avec le retour arrière du backend
-- (feat/account-erasure retiré, ENABLE_ACCOUNT_DELETE et ENABLE_RETENTION_ERASURE
-- désactivés, scénario Make de conservation arrêté).
--
-- CE QUI EST DÉFAIT
--   - les fonctions erase_user_data, retention_candidates, refresh_last_seen ;
--   - le déclencheur trg_track_access_end et sa fonction ;
--   - posts et réponses : ON DELETE CASCADE comme avant (au lieu de SET NULL) ;
--   - vues de la communauté : jointure simple, comme à l'étape 4 de
--     2026-11-25-security-hardening.sql.
-- CE QUI EST GARDÉ (sans effet une fois les fonctions retirées)
--   - user_id reste nullable sur posts et réponses : remettre NOT NULL échouerait
--     si des messages ont déjà été anonymisés ;
--   - les 4 clés en CASCADE (daily_activity, lesson_completions, pacte_entries,
--     diagnostic_results) : plus sûr que NO ACTION pour toute suppression ;
--   - les colonnes (last_seen_at, dates d'avertissement, access_ended_at) et le
--     journal account_erasures, preuve des effacements déjà faits. Les retirer à
--     la main seulement si aucun effacement n'a eu lieu (voir la fin du fichier).
-- Une seule transaction : si une ligne échoue, rien n'est défait.
-- ============================================================================

begin;

drop function if exists public.erase_user_data(uuid, boolean);
drop function if exists public.retention_candidates(interval);
drop function if exists public.refresh_last_seen();

drop trigger if exists trg_track_access_end on public.entitlements;
drop function if exists public.track_access_end();

alter table public.community_posts
  drop constraint community_posts_user_id_fkey,
  add constraint community_posts_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade;
alter table public.community_replies
  drop constraint community_replies_user_id_fkey,
  add constraint community_replies_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade;

-- Vues d'origine (étape 4 de 2026-11-25-security-hardening.sql). Un message déjà
-- anonymisé (user_id vide) n'y apparaît plus.
drop view public.community_replies_view;
drop view public.community_posts_view;

create view public.community_posts_view
with (security_invoker = false, security_barrier = true) as
select p.id,
       pr.pseudonym,
       pr.is_founder,
       p.pillar_tag,
       p.content,
       p.created_at,
       p.is_hidden,
       (select count(*)
          from public.community_replies r
         where r.post_id = p.id and r.is_hidden = false) as reply_count,
       (p.user_id = auth.uid()) as is_mine
from public.community_posts p
join public.profiles pr on pr.id = p.user_id
where public.has_active_entitlement(auth.uid())
  and (p.is_hidden = false or p.user_id = auth.uid());

comment on view public.community_posts_view is
  'Droits du propriétaire volontaires : lit les pseudonymes des autres membres sans exposer profiles. Le WHERE reproduit la politique posts_select. Ne jamais exposer user_id.';

create view public.community_replies_view
with (security_invoker = false, security_barrier = true) as
select r.id,
       r.post_id,
       pr.pseudonym,
       pr.is_founder,
       r.content,
       r.created_at,
       r.is_hidden,
       (r.user_id = auth.uid()) as is_mine
from public.community_replies r
join public.profiles pr on pr.id = r.user_id
where public.has_active_entitlement(auth.uid())
  and (r.is_hidden = false or r.user_id = auth.uid());

comment on view public.community_replies_view is
  'Droits du propriétaire volontaires : lit les pseudonymes des autres membres sans exposer profiles. Le WHERE reproduit la politique replies_select. Ne jamais exposer user_id.';

revoke all on public.community_posts_view from public, anon, authenticated;
revoke all on public.community_replies_view from public, anon, authenticated;
grant select on public.community_posts_view to authenticated;
grant select on public.community_replies_view to authenticated;

commit;

-- Vérification (attendu : 0 ligne pour les 4 fonctions) :
-- select proname from pg_proc where pronamespace = 'public'::regnamespace
--   and proname in ('erase_user_data', 'retention_candidates', 'refresh_last_seen', 'track_access_end');

-- Facultatif, SEULEMENT si aucun effacement n'a eu lieu
-- (select count(*) from public.account_erasures; doit renvoyer 0) :
-- begin;
-- drop table public.account_erasures;
-- alter table public.entitlements drop column access_ended_at;
-- alter table public.profiles drop column last_seen_at,
--   drop column erasure_warn30_sent_at, drop column erasure_warn7_sent_at;
-- commit;
