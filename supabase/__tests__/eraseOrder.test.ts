/**
 * Ordre d'effacement de public.erase_user_data : une table qui en référence une
 * autre parmi les 17 tables personnelles doit être effacée AVANT elle, sinon
 * l'effacement échoue (cas réel : user_mandala → diagnostic_results).
 *
 * Sources des clés étrangères :
 *  - supabase/personal-table-fks.json (sortie de la requête B de
 *    supabase/checks/personal-table-fks.sql, lancée sur la base) ;
 *  - les clauses « references » des fichiers de supabase/migrations.
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const MIGRATION = path.join(ROOT, 'migrations', '2026-11-27-account-erasure.sql');
const FIXTURE = path.join(ROOT, 'personal-table-fks.json');

const PERSONAL_TABLES = [
  'user_mandala', 'user_pillar_priority', 'weekly_commitments', 'weekly_reviews',
  'journal_entries', 'pacte_entries', 'diagnostic_results', 'conversations',
  'daily_activity', 'lesson_completions', 'user_progress', 'streaks',
  'tracker_entries', 'tracker_settings', 'ai_quota', 'entitlements', 'profiles',
];

type Fk = { child: string; parent: string; source: string };

/** Ordre réel des suppressions dans le corps de erase_user_data. */
function deletionOrder(sql: string): string[] {
  const start = sql.indexOf('create or replace function public.erase_user_data');
  if (start < 0) throw new Error('erase_user_data introuvable');
  const end = sql.indexOf('$function$;', start);
  const body = sql.slice(start, end);

  const steps: { at: number; tables: string[] }[] = [];
  const loop = /foreach\s+t\s+in\s+array\s+array\[([\s\S]*?)\]/i.exec(body);
  if (!loop) throw new Error('boucle des tables personnelles introuvable');
  steps.push({ at: loop.index, tables: [...loop[1].matchAll(/'([a-z_]+)'/g)].map((m) => m[1]) });
  for (const m of body.matchAll(/delete\s+from\s+public\.([a-z_]+)/gi)) {
    steps.push({ at: m.index ?? 0, tables: [m[1].toLowerCase()] });
  }
  return steps.sort((a, b) => a.at - b.at).flatMap((s) => s.tables);
}

/** Clés « references » trouvées dans les migrations, entre tables personnelles. */
function migrationFks(): Fk[] {
  const dir = path.join(ROOT, 'migrations');
  const fks: Fk[] = [];
  for (const file of fs.readdirSync(dir).filter((f: string) => f.endsWith('.sql') && !/ROLLBACK/i.test(f))) {
    const sql = fs.readFileSync(path.join(dir, file), 'utf8').replace(/--[^\n]*/g, '');
    for (const stmt of sql.split(';')) {
      const owner = /(?:create\s+table(?:\s+if\s+not\s+exists)?|alter\s+table(?:\s+only)?)\s+(?:public\.)?([a-z_]+)/i.exec(stmt);
      if (!owner) continue;
      for (const ref of stmt.matchAll(/references\s+(?:(public|auth)\.)?([a-z_]+)/gi)) {
        if ((ref[1] ?? 'public').toLowerCase() !== 'public') continue;
        fks.push({ child: owner[1].toLowerCase(), parent: ref[2].toLowerCase(), source: file });
      }
    }
  }
  return fks.filter((fk) => PERSONAL_TABLES.includes(fk.child) && PERSONAL_TABLES.includes(fk.parent));
}

function fixtureFks(): Fk[] {
  const json = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
  return (json.fks as { child: string; parent: string }[]).map((fk) => ({ ...fk, source: 'personal-table-fks.json' }));
}

/** Clés contredites par l'ordre : le parent est effacé avant l'enfant. */
function violations(order: string[], fks: Fk[]): string[] {
  return fks
    .filter((fk) => fk.child !== fk.parent)
    .filter((fk) => order.indexOf(fk.parent) < order.indexOf(fk.child))
    .map((fk) => `${fk.child} → ${fk.parent} (${fk.source}) : ${fk.parent} est effacée avant ${fk.child}`);
}

describe("ordre d'effacement de erase_user_data", () => {
  const order = deletionOrder(fs.readFileSync(MIGRATION, 'utf8'));
  const fks = [...fixtureFks(), ...migrationFks()];

  it('efface les 17 tables personnelles, chacune une fois, profiles en dernier', () => {
    const personal = order.filter((t) => PERSONAL_TABLES.includes(t));
    expect([...personal].sort()).toEqual([...PERSONAL_TABLES].sort());
    expect(new Set(personal).size).toBe(personal.length);
    expect(personal[personal.length - 1]).toBe('profiles');
  });

  it('les clés connues ne portent que sur les 17 tables', () => {
    for (const fk of fixtureFks()) {
      expect(PERSONAL_TABLES).toContain(fk.child);
      expect(PERSONAL_TABLES).toContain(fk.parent);
    }
  });

  it("aucune clé étrangère entre ces tables ne contredit l'ordre", () => {
    expect(violations(order, fks)).toEqual([]);
  });

  it("détecte l'ordre fautif d'avant (diagnostic_results avant user_mandala)", () => {
    const old = ['diagnostic_results', 'user_mandala', 'entitlements', 'profiles'];
    expect(violations(old, [{ child: 'user_mandala', parent: 'diagnostic_results', source: 'test' }])).toHaveLength(1);
  });
});
