-- ============================================================================
-- RETOUR ARRIÈRE — 2026-11-25-security-hardening.sql
--
-- Chaque bloc R<n> annule l'ÉTAPE <n> et ramène la base à l'état exact où
-- elle était juste avant cette étape (définitions et droits issus du
-- diagnostic du 2026-11-25).
-- Annuler dans l'ordre INVERSE : R6, puis R5, etc. N'annuler que les
-- étapes déjà appliquées.
-- Comme pour le script principal : un bloc à la fois, dans une transaction.
-- ============================================================================


-- ============================================================================
-- DÉBUT R6 — annule l'étape 6 (droits profiles et ai_quota)
-- ============================================================================
begin;

-- Droits de table d'origine (diagnostic) :
--   profiles  → anon, authenticated : DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE
--   ai_quota  → anon, authenticated : REFERENCES, SELECT, TRIGGER
-- « grant all puis revoke » plutôt qu'une liste : redonne aussi MAINTAIN
-- (Postgres 17), que l'état d'origine avait, sans erreur en Postgres 15.
grant all on public.profiles to anon, authenticated;
revoke update on public.profiles from anon, authenticated;
grant all on public.ai_quota to anon, authenticated;
revoke insert, update, delete, truncate on public.ai_quota from anon, authenticated;

commit;

-- Puis rejouer les lignes « colonne » de la sauvegarde (étape 0) qui
-- concernent profiles ou ai_quota (droits par colonne explicites
-- éventuels ; il n'y en a peut-être aucune).
-- FIN R6


-- ============================================================================
-- DÉBUT R5 — annule l'étape 5 (droits communauté)
-- ============================================================================
begin;

-- revoke all retire aussi les droits par colonne accordés à l'étape 5.
revoke all on public.community_posts from anon, authenticated;
revoke all on public.community_replies from anon, authenticated;
revoke all on public.community_reports from anon, authenticated;

-- Droits d'origine : tous (DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE).
grant all on public.community_posts to anon, authenticated;
grant all on public.community_replies to anon, authenticated;
grant all on public.community_reports to anon, authenticated;

commit;
-- FIN R5


-- ============================================================================
-- DÉBUT R4 — annule l'étape 4 (vues sans user_id)
-- Ramène les vues à l'état de l'étape 3 : security_invoker, user_id + is_mine.
-- ============================================================================
begin;

drop view public.community_replies_view;
drop view public.community_posts_view;

create view public.community_posts_view
with (security_invoker = true) as
select p.id,
       p.user_id,
       pr.pseudonym,
       pr.is_founder,
       p.pillar_tag,
       p.content,
       p.created_at,
       p.is_hidden,
       (select count(*) as count
          from public.community_replies r
         where r.post_id = p.id and r.is_hidden = false) as reply_count,
       (p.user_id = auth.uid()) as is_mine
from public.community_posts p
join public.public_community_profiles pr on pr.id = p.user_id;

create view public.community_replies_view
with (security_invoker = true) as
select r.id,
       r.post_id,
       r.user_id,
       pr.pseudonym,
       pr.is_founder,
       r.content,
       r.created_at,
       r.is_hidden,
       (r.user_id = auth.uid()) as is_mine
from public.community_replies r
join public.public_community_profiles pr on pr.id = r.user_id;

-- Droits d'origine des vues : SELECT pour authenticated uniquement.
revoke all on public.community_posts_view from public, anon, authenticated;
revoke all on public.community_replies_view from public, anon, authenticated;
grant select on public.community_posts_view to authenticated;
grant select on public.community_replies_view to authenticated;

-- Indispensable : en security_invoker, l'appelant doit pouvoir lire
-- public_community_profiles. Les autres droits d'origine de cette vue ne
-- figuraient pas dans le diagnostic : ils sont dans la sauvegarde (étape 0).
grant select on public.public_community_profiles to authenticated;

commit;

-- Puis rejouer TOUTES les lignes « table » de la sauvegarde (étape 0) qui
-- concernent public_community_profiles.
-- FIN R4


-- ============================================================================
-- DÉBUT R3 — annule l'étape 3 (ajout de is_mine)
-- Définitions d'origine exactes (diagnostic). Il faut DROP + CREATE pour
-- retirer la colonne is_mine.
-- ⚠️ Les builds de l'app qui lisent is_mine cesseront d'afficher la Communauté.
-- ============================================================================
begin;

drop view public.community_replies_view;
drop view public.community_posts_view;

create view public.community_posts_view
with (security_invoker = true) as
select p.id,
       p.user_id,
       pr.pseudonym,
       pr.is_founder,
       p.pillar_tag,
       p.content,
       p.created_at,
       p.is_hidden,
       (select count(*) as count
          from public.community_replies r
         where r.post_id = p.id and r.is_hidden = false) as reply_count
from public.community_posts p
join public.public_community_profiles pr on pr.id = p.user_id;

create view public.community_replies_view
with (security_invoker = true) as
select r.id,
       r.post_id,
       r.user_id,
       pr.pseudonym,
       pr.is_founder,
       r.content,
       r.created_at,
       r.is_hidden
from public.community_replies r
join public.public_community_profiles pr on pr.id = r.user_id;

revoke all on public.community_posts_view from public, anon, authenticated;
revoke all on public.community_replies_view from public, anon, authenticated;
grant select on public.community_posts_view to authenticated;
grant select on public.community_replies_view to authenticated;

commit;
-- FIN R3


-- ============================================================================
-- DÉBUT R2 — annule l'étape 2 (fonctions déclencheurs, signalements)
-- ============================================================================
begin;

alter function public.handle_new_user() reset search_path;

-- Définition d'origine exacte (sans search_path, comptage non distinct).
create or replace function public.apply_auto_hide()
returns trigger
language plpgsql
security definer
as $function$
declare
  distinct_reports int;
begin
  select count(*) into distinct_reports
  from community_reports
  where target_type = new.target_type and target_id = new.target_id;

  if distinct_reports >= 3 then
    if new.target_type = 'post' then
      update community_posts set is_hidden = true where id = new.target_id;
    else
      update community_replies set is_hidden = true where id = new.target_id;
    end if;
  end if;

  return new;
end;
$function$;
alter function public.apply_auto_hide() reset search_path;

-- Politique d'origine : rôle public, sans contrôle d'abonnement.
drop policy if exists reports_insert on public.community_reports;
create policy reports_insert on public.community_reports
  for insert to public
  with check (reporter_id = auth.uid());

commit;
-- FIN R2


-- ============================================================================
-- DÉBUT R1 — annule l'étape 1 (has_active_entitlement, recompute_pillar_priority)
-- ============================================================================
begin;

-- Définition d'origine exacte.
create or replace function public.has_active_entitlement(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
as $function$
  select exists (
    select 1 from entitlements e
    where e.supabase_user_id = p_user_id
      and e.status in ('trialing', 'active')
  );
$function$;

-- Droits d'origine : exécutable par PUBLIC (défaut Postgres), anon et
-- authenticated. Vérifier avec les lignes « fonction » de l'étape 0.
grant execute on function public.has_active_entitlement(uuid) to public, anon, authenticated;
grant execute on function public.recompute_pillar_priority(uuid) to public, anon, authenticated;

commit;
-- FIN R1
