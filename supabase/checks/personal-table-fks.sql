-- ============================================================================
-- LECTURE SEULE — clés étrangères touchant les 17 tables personnelles
-- (Le Code Masculin). Rien n'est modifié.
--
-- Sert à vérifier l'ordre d'effacement de public.erase_user_data
-- (2026-11-27-account-erasure.sql) : une table qui en référence une autre
-- doit être effacée AVANT elle.
--
-- Requête A : toutes les clés qui partent d'une table personnelle ou qui y
--             arrivent (hors auth.users). Une clé venant d'une table NON
--             personnelle (entre_tables_personnelles = false, table_enfant hors
--             liste) bloquerait aussi l'effacement : à signaler.
-- Requête B : les seules clés ENTRE tables personnelles, en JSON, à coller dans
--             supabase/personal-table-fks.json (champ "fks") pour le test.
-- ============================================================================

-- Requête A
with perso(t) as (values
  ('user_mandala'), ('user_pillar_priority'), ('weekly_commitments'), ('weekly_reviews'),
  ('journal_entries'), ('pacte_entries'), ('diagnostic_results'), ('conversations'),
  ('daily_activity'), ('lesson_completions'), ('user_progress'), ('streaks'),
  ('tracker_entries'), ('tracker_settings'), ('ai_quota'), ('entitlements'), ('profiles')
),
fk as (
  select ns_c.nspname as schema_enfant, c.relname as table_enfant,
         ns_p.nspname as schema_parent, p.relname as table_parent,
         con.conname,
         case con.confdeltype when 'a' then 'NO ACTION' when 'r' then 'RESTRICT'
              when 'c' then 'CASCADE' when 'n' then 'SET NULL' when 'd' then 'SET DEFAULT' end as on_delete
  from pg_constraint con
  join pg_class c on c.oid = con.conrelid
  join pg_namespace ns_c on ns_c.oid = c.relnamespace
  join pg_class p on p.oid = con.confrelid
  join pg_namespace ns_p on ns_p.oid = p.relnamespace
  where con.contype = 'f'
)
select fk.*,
       (fk.schema_enfant = 'public' and fk.table_enfant in (select t from perso)
        and fk.schema_parent = 'public' and fk.table_parent in (select t from perso)) as entre_tables_personnelles
from fk
where not (fk.schema_parent = 'auth' and fk.table_parent = 'users')
  and ((fk.schema_enfant = 'public' and fk.table_enfant in (select t from perso))
    or (fk.schema_parent = 'public' and fk.table_parent in (select t from perso)))
order by entre_tables_personnelles desc, table_parent, table_enfant;

-- Requête B
with perso(t) as (values
  ('user_mandala'), ('user_pillar_priority'), ('weekly_commitments'), ('weekly_reviews'),
  ('journal_entries'), ('pacte_entries'), ('diagnostic_results'), ('conversations'),
  ('daily_activity'), ('lesson_completions'), ('user_progress'), ('streaks'),
  ('tracker_entries'), ('tracker_settings'), ('ai_quota'), ('entitlements'), ('profiles')
)
select coalesce(jsonb_agg(jsonb_build_object(
         'child', c.relname,
         'parent', p.relname,
         'on_delete', case con.confdeltype when 'a' then 'NO ACTION' when 'r' then 'RESTRICT'
              when 'c' then 'CASCADE' when 'n' then 'SET NULL' when 'd' then 'SET DEFAULT' end
       ) order by c.relname, p.relname), '[]'::jsonb) as fks
from pg_constraint con
join pg_class c on c.oid = con.conrelid
join pg_class p on p.oid = con.confrelid
where con.contype = 'f'
  and c.relnamespace = 'public'::regnamespace and c.relname in (select t from perso)
  and p.relnamespace = 'public'::regnamespace and p.relname in (select t from perso)
  and c.oid <> p.oid;
