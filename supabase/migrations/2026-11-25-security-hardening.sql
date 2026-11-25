-- ============================================================================
-- Durcissement sécurité Supabase — Le Code Masculin
-- Version 2, réécrite le 2026-11-25 à partir du diagnostic réel de la base
-- (définitions des vues et des fonctions, colonnes, droits, déclencheurs).
--
-- NE PAS EXÉCUTER EN UNE FOIS.
-- Lancer chaque ÉTAPE séparément dans le SQL Editor (sélectionner le bloc
-- entre « DÉBUT ÉTAPE n » et « FIN ÉTAPE n », puis Run), faire le test app
-- indiqué, et seulement ensuite passer à l'étape suivante.
-- Chaque étape est dans une transaction : si une ligne échoue, rien n'est
-- appliqué pour cette étape.
--
-- Retour arrière : 2026-11-25-security-hardening-ROLLBACK.sql, mêmes numéros.
-- Annuler dans l'ordre inverse (si l'étape 6 pose problème, annuler la 6,
-- pas les précédentes).
--
-- Ordre et dépendance à l'app :
--   0  sauvegarde (lecture seule)
--   1  fonctions : has_active_entitlement, recompute_pillar_priority
--   2  fonctions déclencheurs + signalements (M4)
--   3  vues : ajout de is_mine (compatible avec l'app actuelle)
--      → installer le build de l'app qui lit is_mine au lieu de user_id
--   4  vues : retrait de user_id (casse les builds qui lisent encore user_id)
--   5  droits par colonne sur la communauté
--   6  droits sur profiles et ai_quota
-- ============================================================================


-- ============================================================================
-- DÉBUT ÉTAPE 0 — Sauvegarde des droits actuels (lecture seule, ne modifie rien)
-- ----------------------------------------------------------------------------
-- Lancer et TÉLÉCHARGER LE RÉSULTAT en CSV avant toute autre étape.
-- Chaque ligne est une instruction GRANT qui recrée un droit existant, lue
-- directement dans les ACL (y compris MAINTAIN en Postgres 17 et le droit
-- PUBLIC sur les fonctions, absents d'information_schema) : c'est la
-- référence exacte pour le retour arrière, notamment les éventuels droits
-- par colonne sur profiles, que le diagnostic ne montrait pas.
-- ============================================================================
select 'table' as niveau,
       format('grant %s on public.%I to %s;', a.privilege_type, c.relname,
              case when a.grantee = 0 then 'public' else quote_ident(g.rolname) end) as instruction
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
cross join lateral aclexplode(c.relacl) a
left join pg_roles g on g.oid = a.grantee
where n.nspname = 'public'
  and c.relname in ('profiles', 'ai_quota', 'community_posts', 'community_replies',
                    'community_reports', 'community_posts_view', 'community_replies_view',
                    'public_community_profiles')
  and (a.grantee = 0 or g.rolname in ('anon', 'authenticated'))
union all
-- Droits par colonne EXPLICITES uniquement (pas ceux qui découlent des droits de table).
select 'colonne',
       format('grant %s (%I) on public.%I to %s;', a.privilege_type, att.attname, c.relname,
              case when a.grantee = 0 then 'public' else quote_ident(g.rolname) end)
from pg_attribute att
join pg_class c on c.oid = att.attrelid
join pg_namespace n on n.oid = c.relnamespace
cross join lateral aclexplode(att.attacl) a
left join pg_roles g on g.oid = a.grantee
where n.nspname = 'public'
  and c.relname in ('profiles', 'ai_quota', 'community_posts', 'community_replies', 'community_reports')
  and att.attacl is not null
  and (a.grantee = 0 or g.rolname in ('anon', 'authenticated'))
union all
select 'fonction',
       format('grant execute on function %s to %s;', p.oid::regprocedure,
              case when a.grantee = 0 then 'public' else quote_ident(g.rolname) end)
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
left join pg_roles g on g.oid = a.grantee
where n.nspname = 'public'
  and p.proname in ('has_active_entitlement', 'recompute_pillar_priority', 'apply_auto_hide', 'handle_new_user')
  and (a.grantee = 0 or g.rolname in ('anon', 'authenticated'))
order by 1, 2;

-- Contrôle avant l'étape 1 : tout ce qui appelle has_active_entitlement,
-- dans TOUS les schémas (politiques, fonctions, vues). Chaque ligne doit
-- l'appeler avec auth.uid() ; sinon, ne pas lancer l'étape 1 et me
-- montrer le résultat.
select 'politique' as type, schemaname || '.' || tablename || ' / ' || policyname as objet,
       coalesce('USING ' || qual, '') || coalesce(' CHECK ' || with_check, '') as definition
from pg_policies
where coalesce(qual, '') ilike '%has_active_entitlement%'
   or coalesce(with_check, '') ilike '%has_active_entitlement%'
union all
select 'fonction', p.oid::regprocedure::text, p.prosrc
from pg_proc p
where p.prosrc ilike '%has_active_entitlement%' and p.proname <> 'has_active_entitlement'
union all
select 'vue', c.oid::regclass::text, pg_get_viewdef(c.oid, true)
from pg_class c
where c.relkind in ('v', 'm') and pg_get_viewdef(c.oid, true) ilike '%has_active_entitlement%'
order by 1, 2;
-- Attendu : 4 politiques (posts_insert, posts_select, replies_insert,
-- replies_select), toutes avec has_active_entitlement(auth.uid()).

-- Contrôle avant l'étape 4 : les nouvelles vues lisent les tables avec les
-- droits de leur propriétaire (le rôle qui lance le script, postgres dans
-- le SQL Editor). Il doit posséder ces tables ou avoir BYPASSRLS, sinon la
-- RLS de profiles (« sa propre ligne ») masquerait les pseudonymes des autres.
-- Attendu : propriétaire = postgres et/ou bypassrls = true sur chaque ligne.
select c.relname as table_name, pg_get_userbyid(c.relowner) as proprietaire,
       (select rolbypassrls from pg_roles where rolname = current_user) as bypassrls_du_role_courant,
       current_user as role_courant
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('community_posts', 'community_replies', 'profiles', 'entitlements');

-- Contrôle avant l'étape 2 : le déclencheur trg_auto_hide est bien
-- AFTER INSERT ... FOR EACH ROW.
select trigger_name, action_timing, event_manipulation, action_orientation
from information_schema.triggers
where trigger_schema = 'public' and trigger_name = 'trg_auto_hide';
-- FIN ÉTAPE 0


-- ============================================================================
-- DÉBUT ÉTAPE 1 — has_active_entitlement et recompute_pillar_priority
-- ----------------------------------------------------------------------------
-- Appels .rpc() de l'app : uniquement recompute_pillar_priority
-- (src/services/supabase.ts). Elle GARDE le droit authenticated ; son code
-- réel contient déjà le contrôle auth.uid() (raise 'forbidden' si
-- p_user_id ≠ appelant). On retire seulement anon, qui n'en a aucun usage.
--
-- has_active_entitlement(p_user_id) : nécessaire aux politiques de la
-- communauté (exécutée en tant qu'authenticated), mais elle répondait pour
-- N'IMPORTE QUEL identifiant → on pouvait savoir si un autre membre est
-- premium. Elle ne répond plus que pour l'appelant (ou service_role).
--
-- Déjà correct d'après le diagnostic, donc pas modifié :
--   get_user_id_by_email, expire_fixed_term_access,
--   create_user_mandala_if_none_exists (anon=false, auth=false ; cette
--   dernière est appelée depuis recompute_pillar_priority, qui est
--   SECURITY DEFINER, donc elle continue de fonctionner),
--   generate_pseudonym, assign_pseudonym_on_insert.
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

revoke execute on function public.recompute_pillar_priority(uuid) from public, anon;
grant execute on function public.recompute_pillar_priority(uuid) to authenticated, service_role;

commit;

-- Vérification (attendu : anon=false, auth=true pour les deux) :
-- select p.proname,
--        has_function_privilege('anon', p.oid, 'execute') as anon,
--        has_function_privilege('authenticated', p.oid, 'execute') as auth
-- from pg_proc p join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public' and p.proname in ('has_active_entitlement', 'recompute_pillar_priority');
--
-- TEST APP après l'étape 1 :
--   a. Compte PREMIUM → onglet Communauté : le fil s'affiche, publier un
--      post fonctionne.
--   b. Compte GRATUIT → Communauté : écran verrouillé, aucun post visible.
--   c. Nouveau compte → faire le diagnostic → l'écran Mandala affiche les
--      3 piliers prioritaires (recompute_pillar_priority toujours appelable).
-- FIN ÉTAPE 1


-- ============================================================================
-- DÉBUT ÉTAPE 2 — Fonctions déclencheurs et signalements
-- ----------------------------------------------------------------------------
-- handle_new_user et apply_auto_hide sont SECURITY DEFINER sans search_path
-- figé. apply_auto_hide utilisait en plus des noms de tables non qualifiés.
-- Ce sont des fonctions de déclencheur (returns trigger) : elles ne peuvent
-- pas être appelées directement, donc pas de contrôle d'appelant à ajouter.
--
-- Diff apply_auto_hide par rapport à l'original : search_path figé, tables
-- préfixées public., count(*) → count(distinct reporter_id). Même
-- déclencheur (AFTER INSERT), même seuil (>= 3), même branche else.
--
-- M4 : n'importe quel compte, même gratuit, pouvait signaler. Trois comptes
-- gratuits créés par une même personne suffisaient à masquer le post d'un
-- autre. Désormais : seuls les membres actifs signalent, et le seuil compte
-- des signalants distincts.
-- ============================================================================
begin;

alter function public.handle_new_user() set search_path to 'public', 'pg_temp';

create or replace function public.apply_auto_hide()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  distinct_reports int;
begin
  select count(distinct r.reporter_id) into distinct_reports
  from public.community_reports r
  where r.target_type = new.target_type
    and r.target_id = new.target_id;

  if distinct_reports >= 3 then
    if new.target_type = 'post' then
      update public.community_posts set is_hidden = true where id = new.target_id;
    else
      update public.community_replies set is_hidden = true where id = new.target_id;
    end if;
  end if;

  return new;
end;
$function$;

drop policy if exists reports_insert on public.community_reports;
create policy reports_insert on public.community_reports
  for insert to authenticated
  with check (reporter_id = auth.uid() and public.has_active_entitlement(auth.uid()));

commit;

-- TEST APP après l'étape 2 :
--   a. Créer un NOUVEAU compte (inscription + code email) → l'accueil
--      s'affiche normalement, avec la série (streak) et le compteur du coach.
--      ⚠️ handle_new_user AVALE ses erreurs (exception when others → simple
--      warning) : une inscription qui « marche » ne prouve rien. Vérifier
--      que les 3 lignes existent pour ce compte :
--        select (select count(*) from public.profiles  where id      = u.id) as profiles,
--               (select count(*) from public.streaks   where user_id = u.id) as streaks,
--               (select count(*) from public.ai_quota  where user_id = u.id) as ai_quota,
--               (select pseudonym from public.profiles where id      = u.id) as pseudonyme
--        from auth.users u where u.email = '<email du nouveau compte>';
--      Attendu : 1 | 1 | 1 | un pseudonyme non vide.
--   b. Compte PREMIUM → signaler un post → message de confirmation,
--      aucune erreur.
--   c. (Optionnel) Avec 3 comptes premium distincts, signaler le même post :
--      il disparaît du fil des autres membres.
-- FIN ÉTAPE 2


-- ============================================================================
-- DÉBUT ÉTAPE 3 — Vues communauté : ajout de is_mine (sans rien retirer)
-- ----------------------------------------------------------------------------
-- Étape de transition : les vues gardent user_id pour que l'app actuelle
-- continue de marcher, et gagnent is_mine (vrai si la ligne appartient à
-- l'appelant). create or replace ne peut qu'AJOUTER des colonnes en fin de
-- liste : définitions identiques à l'existant + is_mine.
-- ============================================================================
begin;

create or replace view public.community_posts_view
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

create or replace view public.community_replies_view
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

commit;

-- TEST APP après l'étape 3 (build ACTUEL, pas encore mis à jour) :
--   a. Compte PREMIUM → fil de la Communauté et détail d'un post : identiques
--      à avant (pseudonymes, badge Fondateur, nombre de réponses).
--
-- PUIS installer le build de l'app qui lit is_mine
-- (src/services/communityService.ts) et refaire le test a.
-- Ne passer à l'étape 4 que lorsque TOUS les builds en circulation lisent
-- is_mine : l'étape 4 casse la Communauté des anciens builds.
-- FIN ÉTAPE 3


-- ============================================================================
-- DÉBUT ÉTAPE 4 — Vues communauté sans user_id
-- ----------------------------------------------------------------------------
-- Problème : les vues étaient en security_invoker = true. Pour lire le
-- pseudonyme des AUTRES membres malgré la RLS de profiles (chacun ne voit
-- que sa propre ligne), elles passaient par public_community_profiles.
-- Cette vue, en droits du propriétaire, expose id + pseudonyme + badge de
-- TOUS les comptes ; l'appelant doit avoir SELECT dessus, donc elle était
-- lisible directement via l'API. En plus, les vues renvoyaient user_id.
-- Résultat : le pseudonymat ne tenait pas (pseudonyme ↔ identifiant).
--
-- Solution : vues en droits du propriétaire (security_invoker = false), qui
-- REPRODUISENT exactement le filtre des politiques posts_select et
-- replies_select (membre actif ; posts masqués visibles par leur seul
-- auteur), avec security_barrier pour que les filtres envoyés par le client
-- ne soient jamais évalués avant ce filtre. Elles ne renvoient plus user_id
-- mais is_mine. public_community_profiles n'est plus nécessaire à l'appelant
-- et n'est plus lisible via l'API.
--
-- Il faut DROP puis CREATE (on ne peut pas retirer une colonne avec
-- create or replace). Les nouvelles vues reçoivent les droits par défaut
-- de Supabase (souvent ALL pour anon) : on les remet explicitement.
-- ============================================================================
begin;

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

-- Conservée (pour un retour arrière simple) mais plus lisible via l'API.
revoke all on public.public_community_profiles from public, anon, authenticated;

commit;

-- TEST APP après l'étape 4 (build qui lit is_mine) :
--   a. Compte PREMIUM → fil et détail d'un post : pseudonymes, badge
--      Fondateur, nombre de réponses, tri du plus récent au plus ancien.
--   b. Compte PREMIUM → filtrer par pilier : le filtre fonctionne.
--   c. Compte GRATUIT → Communauté : aucun post visible.
--   d. Un post masqué (3 signalements) : visible pour son auteur seulement.
--   e. (Contrôle API, facultatif) depuis un navigateur :
--      GET <SUPABASE_URL>/rest/v1/public_community_profiles?select=*
--      avec l'en-tête apikey: <clé anon> → erreur « permission denied ».
-- FIN ÉTAPE 4


-- ============================================================================
-- DÉBUT ÉTAPE 5 — Droits par colonne sur les tables de la communauté
-- ----------------------------------------------------------------------------
-- Diagnostic : anon ET authenticated avaient TOUS les droits sur
-- community_posts, community_replies et community_reports (y compris
-- TRUNCATE, qui n'est pas soumis à la RLS ; il n'est pas accessible via
-- l'API REST, mais n'a aucune raison d'exister).
-- Faille concrète : à l'insertion, on pouvait fixer created_at (par exemple
-- en 2099) et épingler son post en tête du fil pour toujours.
--
-- Colonnes réellement insérées par l'app (src/services/communityService.ts) :
--   community_posts   : user_id, content, pillar_tag
--   community_replies : post_id, user_id, content
--   community_reports : target_type, target_id, reporter_id
-- L'app ne lit ces tables qu'à travers les vues (étape 4), ne les modifie
-- jamais et n'a pas de fonction de suppression : UPDATE et DELETE ne sont pas
-- accordés, SELECT seulement sur les colonnes non identifiantes.
-- Realtime : l'app n'utilise ni channel() ni postgres_changes. Les politiques posts_delete_own et replies_delete_own
-- restent en place mais ne servent plus. Si une suppression est ajoutée
-- plus tard : grant select (id, user_id), delete on la table to authenticated.
-- ============================================================================
begin;

revoke all on public.community_posts from public, anon, authenticated;
revoke all on public.community_replies from public, anon, authenticated;
revoke all on public.community_reports from public, anon, authenticated;

grant insert (user_id, content, pillar_tag) on public.community_posts to authenticated;
grant insert (post_id, user_id, content) on public.community_replies to authenticated;
grant insert (target_type, target_id, reporter_id) on public.community_reports to authenticated;

-- Filet de sécurité : SELECT sur les colonnes non identifiantes uniquement
-- (jamais user_id ni reporter_id), toujours filtré par la RLS. Les
-- insertions de l'app n'en ont pas besoin (pas de .select(), donc
-- Prefer: return=minimal), mais cela évite toute dépendance à la façon
-- dont PostgREST construit sa requête d'insertion. Ces colonnes sont déjà
-- visibles par le même public via les vues.
grant select (id, pillar_tag, content, created_at, is_hidden) on public.community_posts to authenticated;
grant select (id, post_id, content, created_at, is_hidden) on public.community_replies to authenticated;
grant select (id, target_type, target_id, created_at) on public.community_reports to authenticated;

commit;

-- TEST APP après l'étape 5 (compte PREMIUM) :
--   a. Publier un post, avec puis sans pilier → il apparaît en tête du fil.
--   b. Répondre à un post → la réponse apparaît, le compteur augmente.
--   c. Signaler un post → confirmation. Le signaler une 2e fois → toujours
--      pas d'erreur affichée (doublon ignoré par l'app).
--   d. Fil et détail d'un post toujours affichés (les vues ne dépendent
--      plus des droits de l'appelant sur ces tables).
-- FIN ÉTAPE 5


-- ============================================================================
-- DÉBUT ÉTAPE 6 — Droits sur profiles et ai_quota
-- ----------------------------------------------------------------------------
-- profiles (colonnes réelles : id, name, avatar_url, created_at, updated_at,
-- full_name, prenom, email, pseudonym, is_founder) :
--   - l'app ne fait que LIRE sa propre ligne (getUserProfile, select('*')) ;
--   - updateUserProfile existe dans src/services/supabase.ts mais n'est
--     appelée nulle part (elle écrit une colonne « niveau » qui n'existe pas) ;
--   - les écritures viennent du déclencheur handle_new_user et du backend
--     (service_role), qui ne sont pas concernés.
--   On garde SELECT pour authenticated (filtré par la RLS) et on retire tout
--   le reste, y compris d'éventuels droits UPDATE par colonne : personne ne
--   peut se donner is_founder ni changer de pseudonyme pour en imiter un autre.
--
-- ai_quota : écrite uniquement par le backend, avec la clé service_role
--   (src/quota.js de lcm-backend a49b96c : lecture de messages_used, insert
--   si absente, update conditionnel ; handle_new_user crée aussi la ligne).
--   service_role n'est pas concerné par cette étape.
--   authenticated garde SELECT (sa ligne, via la RLS), anon perd tout.
-- ============================================================================
begin;

revoke all on public.profiles from public, anon;
revoke insert, update, delete, truncate, references, trigger on public.profiles from authenticated;
grant select on public.profiles to authenticated;

revoke all on public.ai_quota from public, anon;
revoke insert, update, delete, truncate, references, trigger on public.ai_quota from authenticated;
grant select on public.ai_quota to authenticated;

commit;

-- TEST APP après l'étape 6 :
--   a. Se déconnecter puis se reconnecter → l'accueil affiche le prénom.
--   b. Profil : prénom et email affichés, compteur de messages du coach correct.
--   c. Coach : envoyer un message → réponse, le compteur se met à jour.
--   d. Créer un nouveau compte → inscription complète sans erreur (le
--      déclencheur handle_new_user écrit toujours profiles et ai_quota).
--   e. Exporter mes données (PDF) depuis le profil → prénom et email présents.
-- FIN ÉTAPE 6


-- ============================================================================
-- Hors périmètre de ce script, à traiter ensuite :
--   - Les autres tables personnelles (journal_entries, pacte_entries,
--     diagnostic_results, tracker_*, etc.) ont probablement aussi les droits
--     par défaut ALL pour anon. La RLS les protège, mais le même nettoyage
--     (revoke all from anon) est recommandé. Diagnostic à faire avant.
--   - Stockage : le diagnostic ne renvoie AUCUNE politique storage. S'il
--     existe des buckets publics, leurs fichiers sont lisibles par tous.
--     Vérifier Storage > Buckets.
-- ============================================================================
