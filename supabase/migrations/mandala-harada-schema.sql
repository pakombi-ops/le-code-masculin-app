-- ============================================================
-- MANDALA HARADA — SCHÉMA SUPABASE
-- ============================================================
-- ⚠️ Je n'ai pas vue directe sur le schéma réel de user_pillar_priority.
-- Confirmé par services/supabase.ts : diagnostic_results utilise bien la
-- colonne "user_id" (saveDiagnosticResults insère { user_id, scores }) —
-- j'ai donc aligné user_mandala sur "user_id" pour rester cohérent avec le
-- reste de l'app (entitlements est la seule table connue à utiliser
-- "supabase_user_id"). Vérifie que user_pillar_priority suit la même
-- convention "user_id" avant d'exécuter — je ne l'ai pas confirmé.
-- Teste d'abord en staging ou sur une copie.

-- ============================================================
-- 1. TABLE TEMPLATE (contenu statique, écrit une fois, partagé)
-- ============================================================

create table if not exists pillar_mandala_templates (
  pillar_id integer primary key check (pillar_id between 1 and 12),
  pillar_name text not null,
  central_objective_template text not null, -- contient les placeholders {score_avant} et {score_cible}
  satellite_goals jsonb not null,            -- array de 8 : [{ "id": "s1", "title": "...", "description": "..." }, ...]
  created_at timestamptz not null default now()
);

comment on table pillar_mandala_templates is
  'Contenu statique du mandala Harada par pilier. Rempli une fois via script de seed, jamais modifié par les users.';

-- ============================================================
-- 2. TABLE INSTANCE (figée par homme, créée une seule fois)
-- ============================================================

create table if not exists user_mandala (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pillar_id integer not null references pillar_mandala_templates(pillar_id),
  pillar_rank integer not null check (pillar_rank between 1 and 3),
  central_objective text not null,           -- texte final, placeholders déjà remplacés
  score_avant integer not null check (score_avant between 0 and 10),
  score_cible integer not null check (score_cible between 0 and 10),
  satellite_goals jsonb not null,            -- copié du template + { completed: bool, completed_at: timestamptz } par item
  source_diagnostic_id uuid,                 -- FK vers diagnostic_results.id si la table existe — à confirmer
  created_at timestamptz not null default now(),
  unique (user_id, pillar_id)
);

comment on table user_mandala is
  'Instance figée du mandala Harada par homme. Créée une seule fois après le premier diagnostic. Ne se régénère jamais, même si l''homme refait le diagnostic plus tard.';

create index if not exists idx_user_mandala_user on user_mandala (user_id);

-- Row Level Security — l'homme ne voit que son propre mandala
alter table user_mandala enable row level security;

create policy "user reads own mandala"
  on user_mandala for select
  using (auth.uid() = user_id);

create policy "user updates own mandala"
  on user_mandala for update
  using (auth.uid() = user_id);

-- ============================================================
-- 3. FONCTION DE CRÉATION — appelée après recompute_pillar_priority()
-- ============================================================

create or replace function create_user_mandala_if_none_exists(
  p_user_id uuid,
  p_diagnostic_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_existing_count integer;
  r record;
  v_score_avant integer;
  v_score_cible integer;
  v_satellites jsonb;
begin
  -- Garde-fou : ne jamais régénérer si un mandala existe déjà pour ce user
  select count(*) into v_existing_count
  from user_mandala
  where user_id = p_user_id;

  if v_existing_count > 0 then
    return;
  end if;

  -- ⚠️ À vérifier : nom exact des colonnes et de la condition "active"
  -- sur user_pillar_priority. J'utilise "rank" et je suppose une colonne
  -- de statut — remplace par la condition réelle utilisée dans
  -- recompute_pillar_priority().
  for r in
    select
      upp.pillar_id,
      upp.rank as pillar_rank,
      (dr.scores ->> upp.pillar_id::text)::integer as score_avant
    from user_pillar_priority upp
    join diagnostic_results dr on dr.id = p_diagnostic_id
    where upp.user_id = p_user_id
      and upp.rank between 1 and 3
    order by upp.rank
  loop
    v_score_avant := r.score_avant;
    v_score_cible := least(v_score_avant + 3, 10);

    select satellite_goals into v_satellites
    from pillar_mandala_templates
    where pillar_id = r.pillar_id;

    if v_satellites is null then
      raise warning 'Aucun template trouvé pour pillar_id=%, mandala non créé pour ce pilier', r.pillar_id;
      continue;
    end if;

    -- Ajoute l'état de complétion à chaque satellite
    select jsonb_agg(elem || jsonb_build_object('completed', false, 'completed_at', null))
    into v_satellites
    from jsonb_array_elements(v_satellites) elem;

    insert into user_mandala (
      user_id, pillar_id, pillar_rank,
      central_objective, score_avant, score_cible,
      satellite_goals, source_diagnostic_id
    )
    select
      p_user_id,
      r.pillar_id,
      r.pillar_rank,
      replace(
        replace(t.central_objective_template, '{score_avant}', v_score_avant::text),
        '{score_cible}', v_score_cible::text
      ),
      v_score_avant,
      v_score_cible,
      v_satellites,
      p_diagnostic_id
    from pillar_mandala_templates t
    where t.pillar_id = r.pillar_id;
  end loop;
end;
$$;

-- ============================================================
-- 4. POINT D'APPEL
-- ============================================================
-- ⚠️ À trancher : cette fonction doit être appelée soit
--   (a) dans recompute_pillar_priority() elle-même, juste après le calcul du rank
--   (b) depuis le endpoint Railway qui déclenche recompute_pillar_priority()
-- L'option (a) garantit l'atomicité (même transaction). L'option (b) est
-- plus simple à débugger mais crée un risque de désync si l'appel Railway
-- échoue après le recompute. Je recommande (a) si recompute_pillar_priority
-- tourne déjà en tant que fonction Postgres — sinon (b).

-- Exemple d'appel manuel pour test :
-- select create_user_mandala_if_none_exists('<uuid_user>', '<uuid_diagnostic>');
