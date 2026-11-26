#!/usr/bin/env bash
# Applies every Supabase migration to scratch Postgres databases and runs the SQL
# regression checks in supabase/tests. Needs only `psql` and a reachable server:
#   PGHOST=localhost PGPORT=5432 PGUSER=postgres ./scripts/test-migrations.sh
#
# Scenarios
#   clean      — a fresh project: all migrations, re-applied (idempotency), full checks
#   prod-shape — production as found on 2026-11-26: hand-made ai_coach_usage (no unique
#                key, duplicate rows) and tts_usage (legacy play_count), created before
#                the usage_quota_tables migration
set -euo pipefail
cd "$(dirname "$0")/.."

QUOTA_MIGRATION=supabase/migrations/20261126114022_usage_quota_tables.sql

run() { psql -v ON_ERROR_STOP=1 -q -X "$@"; }
fresh_db() {
  run -d postgres -c "drop database if exists $1" -c "create database $1"
  run -d "$1" -f supabase/tests/00_stub_supabase.sql
}
# apply_migrations DB [fixture files to load right before the usage quota migration...]
apply_migrations() {
  local db=$1; shift
  for f in supabase/migrations/*.sql; do
    if [[ "$f" == "$QUOTA_MIGRATION" ]]; then
      for fixture in "$@"; do run -d "$db" -f "$fixture"; done
    fi
    run -d "$db" -f "$f"
  done
}

[[ -f "$QUOTA_MIGRATION" ]] || { echo "missing $QUOTA_MIGRATION" >&2; exit 1; }

echo '== clean project: apply migrations twice (idempotency) + checks'
fresh_db voxa_mig_clean
apply_migrations voxa_mig_clean
for f in supabase/migrations/2026112*.sql; do run -d voxa_mig_clean -f "$f"; done
run -d voxa_mig_clean -f supabase/tests/usage_quota.test.sql

echo '== production-shaped project: hand-made ai_coach_usage + legacy tts_usage'
fresh_db voxa_mig_prod
apply_migrations voxa_mig_prod \
  supabase/tests/legacy_ai_coach_usage.test.sql \
  supabase/tests/legacy_tts_usage.test.sql
run -d voxa_mig_prod -c "
do \$\$ begin
  assert (select message_count from public.ai_coach_usage where usage_date = '2026-11-25') = 7, 'duplicates not folded';
  assert (select count(*) from public.ai_coach_usage) = 2, 'duplicate rows not removed';
end \$\$;"
# re-running the November migrations on the migrated prod shape must be a no-op
for f in supabase/migrations/2026112*.sql; do run -d voxa_mig_prod -f "$f"; done
run -d voxa_mig_prod -f supabase/tests/prod_shape.checks.sql

echo 'All migration checks passed.'
