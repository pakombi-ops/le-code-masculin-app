-- ============================================================================
-- CONSENTEMENTS EXPLICITES — Le Code Masculin (feat/consentement)
-- Données pouvant révéler la santé : accord explicite, daté, retirable.
-- Deux accords séparés :
--   'journal' : journal (journal_entries) et pacte (pacte_entries) ;
--   'coach'   : coach IA (le backend refuse /api/chat* sans accord : 403 consent_required).
--
-- Historique : chaque accord et chaque retrait ajoute une ligne (rien n'est
-- modifié ni effacé, sauf à la suppression du compte, par cascade).
-- Écriture seulement par les fonctions grant_consent / withdraw_consent.
--
-- ÉTAPE 0 : lecture seule, à lancer d'abord (attendu : RLS activée sur les 3 tables,
-- et la liste de leurs politiques actuelles).
-- ÉTAPE 1 : une seule transaction.
-- ÉTAPE 2 : vérification, lecture seule.
-- Retour arrière : 2026-11-28-consents-ROLLBACK.sql
-- ============================================================================

-- ---------------------------------------------------------------- ÉTAPE 0 (lecture seule)
-- select c.relname, c.relrowsecurity
-- from pg_class c where c.relnamespace = 'public'::regnamespace
--   and c.relname in ('journal_entries', 'pacte_entries', 'conversations');
-- select tablename, policyname, permissive, cmd, qual, with_check
-- from pg_policies where schemaname = 'public'
--   and tablename in ('journal_entries', 'pacte_entries', 'conversations')
-- order by tablename, cmd;


-- ---------------------------------------------------------------- ÉTAPE 1
begin;

create table if not exists public.user_consents (
  id           bigint generated always as identity primary key,
  user_id      uuid not null references auth.users (id) on delete cascade,
  purpose      text not null check (purpose in ('journal', 'coach')),
  action       text not null check (action in ('granted', 'withdrawn')),
  text_version text not null check (length(text_version) between 1 and 40),
  erased_data  boolean not null default false,
  created_at   timestamptz not null default now()
);
create index if not exists user_consents_user_purpose_idx
  on public.user_consents (user_id, purpose, created_at desc, id desc);

alter table public.user_consents enable row level security;
revoke all on public.user_consents from public, anon, authenticated;
grant select on public.user_consents to authenticated;
drop policy if exists user_consents_select_own on public.user_consents;
create policy user_consents_select_own on public.user_consents
  for select to authenticated using (user_id = auth.uid());

-- Accord en cours ? (dernier événement = 'granted'). Un utilisateur ne peut
-- interroger que lui-même ; le backend (service_role) peut interroger tout compte.
create or replace function public.has_consent(p_user_id uuid, p_purpose text)
returns boolean
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
as $function$
  select (p_user_id = auth.uid() or coalesce(auth.role(), '') = 'service_role')
     and coalesce((
       select c.action = 'granted'
       from public.user_consents c
       where c.user_id = p_user_id and c.purpose = p_purpose
       order by c.created_at desc, c.id desc
       limit 1
     ), false);
$function$;

-- Donner son accord (utilisateur connecté seulement). Sans effet si un accord
-- de la même version est déjà en cours.
create or replace function public.grant_consent(p_purpose text, p_text_version text)
returns void
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  uid uuid := auth.uid();
  last_action text;
  last_version text;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  if p_purpose is null or p_purpose not in ('journal', 'coach') then raise exception 'invalid_purpose'; end if;
  if p_text_version is null or length(trim(p_text_version)) not between 1 and 40 then raise exception 'invalid_version'; end if;

  select c.action, c.text_version into last_action, last_version
  from public.user_consents c
  where c.user_id = uid and c.purpose = p_purpose
  order by c.created_at desc, c.id desc
  limit 1;

  if last_action = 'granted' and last_version = trim(p_text_version) then
    return;
  end if;

  insert into public.user_consents (user_id, purpose, action, text_version)
  values (uid, p_purpose, 'granted', trim(p_text_version));
end;
$function$;

-- Retirer son accord. p_erase = true : efface aussi les données concernées
-- ('journal' : journal et pacte ; 'coach' : table conversations).
create or replace function public.withdraw_consent(p_purpose text, p_erase boolean)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  uid uuid := auth.uid();
  last_version text;
  result jsonb := '{}'::jsonb;
  n integer;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  if p_purpose is null or p_purpose not in ('journal', 'coach') then raise exception 'invalid_purpose'; end if;

  select c.text_version into last_version
  from public.user_consents c
  where c.user_id = uid and c.purpose = p_purpose
  order by c.created_at desc, c.id desc
  limit 1;

  insert into public.user_consents (user_id, purpose, action, text_version, erased_data)
  values (uid, p_purpose, 'withdrawn', coalesce(last_version, 'aucun'), coalesce(p_erase, false));

  if coalesce(p_erase, false) then
    if p_purpose = 'journal' then
      delete from public.journal_entries where user_id = uid;
      get diagnostics n = row_count;  result := result || jsonb_build_object('journal_entries', n);
      delete from public.pacte_entries where user_id = uid;
      get diagnostics n = row_count;  result := result || jsonb_build_object('pacte_entries', n);
    else
      delete from public.conversations where user_id = uid;
      get diagnostics n = row_count;  result := result || jsonb_build_object('conversations', n);
    end if;
  end if;

  return result;
end;
$function$;

revoke execute on function public.has_consent(uuid, text) from public, anon;
revoke execute on function public.grant_consent(text, text) from public, anon;
revoke execute on function public.withdraw_consent(text, boolean) from public, anon;
grant execute on function public.has_consent(uuid, text) to authenticated, service_role;
grant execute on function public.grant_consent(text, text) to authenticated;
grant execute on function public.withdraw_consent(text, boolean) to authenticated;

-- Règles RESTRICTIVES : s'ajoutent aux politiques existantes (propriétaire de
-- la ligne). Sans accord en cours, plus d'écriture ni de modification ; la
-- lecture et la suppression restent possibles (droit d'accès, effacement).
-- Le backend (service_role) n'est pas concerné (RLS contournée).
drop policy if exists journal_entries_require_consent_insert on public.journal_entries;
create policy journal_entries_require_consent_insert on public.journal_entries
  as restrictive for insert to authenticated
  with check (public.has_consent(auth.uid(), 'journal'));
drop policy if exists journal_entries_require_consent_update on public.journal_entries;
create policy journal_entries_require_consent_update on public.journal_entries
  as restrictive for update to authenticated
  using (public.has_consent(auth.uid(), 'journal'))
  with check (public.has_consent(auth.uid(), 'journal'));

drop policy if exists pacte_entries_require_consent_insert on public.pacte_entries;
create policy pacte_entries_require_consent_insert on public.pacte_entries
  as restrictive for insert to authenticated
  with check (public.has_consent(auth.uid(), 'journal'));
drop policy if exists pacte_entries_require_consent_update on public.pacte_entries;
create policy pacte_entries_require_consent_update on public.pacte_entries
  as restrictive for update to authenticated
  using (public.has_consent(auth.uid(), 'journal'))
  with check (public.has_consent(auth.uid(), 'journal'));

drop policy if exists conversations_require_consent_insert on public.conversations;
create policy conversations_require_consent_insert on public.conversations
  as restrictive for insert to authenticated
  with check (public.has_consent(auth.uid(), 'coach'));

commit;


-- ---------------------------------------------------------------- ÉTAPE 2 (vérification, lecture seule)
-- 2a. Politiques restrictives (attendu : 5 lignes, permissive = RESTRICTIVE).
-- select tablename, policyname, permissive, cmd from pg_policies
-- where schemaname = 'public' and policyname like '%require_consent%' order by 1, 2;
--
-- 2b. Droits (attendu : anon=false partout ; auth=true pour les 3 fonctions).
-- select p.proname, has_function_privilege('anon', p.oid, 'execute') as anon,
--        has_function_privilege('authenticated', p.oid, 'execute') as auth
-- from pg_proc p where p.pronamespace = 'public'::regnamespace
--   and p.proname in ('has_consent', 'grant_consent', 'withdraw_consent');
--
-- 2c. Aucun accord au départ (attendu : 0).
-- select count(*) from public.user_consents;
--
-- 2d. App, compte de test : écrire dans le journal SANS accord → refusé ; donner
--     l'accord → accepté ; retirer → refusé de nouveau ; les anciennes entrées restent lisibles.
