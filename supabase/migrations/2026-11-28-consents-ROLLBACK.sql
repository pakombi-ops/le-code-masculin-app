-- ============================================================================
-- RETOUR ARRIÈRE de 2026-11-28-consents.sql — Le Code Masculin
-- À lancer avec le retour arrière du backend (feat/consentement retiré) : sans
-- has_consent, le backend refuserait le coach à tous (503 consent_check_failed).
--
-- CE QUI EST DÉFAIT : les 5 règles restrictives et les 4 fonctions.
-- CE QUI EST GARDÉ : la table user_consents (preuve des accords déjà donnés).
-- La retirer à la main seulement si elle est vide (voir la fin du fichier).
-- ============================================================================

begin;

drop policy if exists journal_entries_require_consent_insert on public.journal_entries;
drop policy if exists journal_entries_require_consent_update on public.journal_entries;
drop policy if exists pacte_entries_require_consent_insert on public.pacte_entries;
drop policy if exists pacte_entries_require_consent_update on public.pacte_entries;
drop policy if exists conversations_require_consent_insert on public.conversations;

drop function if exists public.delete_my_conversations();
drop function if exists public.withdraw_consent(text, boolean);
drop function if exists public.grant_consent(text, text, timestamptz);
drop function if exists public.has_consent(uuid, text);

commit;

-- Vérification (attendu : 0 ligne) :
-- select policyname from pg_policies where schemaname = 'public' and policyname like '%require_consent%';

-- Facultatif, SEULEMENT si select count(*) from public.user_consents; renvoie 0 :
-- drop table public.user_consents;
