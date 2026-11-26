# CLAUDE.md — le-code-masculin

## Git

- Toujours faire `git fetch` et partir de `origin/main` avant de créer une branche.

## Supabase

- Le compte fondateur (profiles.is_founder) a un Premium permanent imposé par des déclencheurs sur entitlements et ai_quota. Ne jamais rendre is_founder modifiable par l'app.
  Voir supabase/migrations/2026-11-25-founder-premium.sql.
