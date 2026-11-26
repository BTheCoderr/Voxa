#!/usr/bin/env bash
# Applies every Supabase migration to a scratch Postgres database and runs the SQL
# regression checks in supabase/tests. Needs only `psql` and a reachable server:
#   PGHOST=localhost PGPORT=5432 PGUSER=postgres ./scripts/test-migrations.sh
set -euo pipefail
cd "$(dirname "$0")/.."

run() { psql -v ON_ERROR_STOP=1 -q -X "$@"; }
fresh_db() {
  run -d postgres -c "drop database if exists $1" -c "create database $1"
  run -d "$1" -f supabase/tests/00_stub_supabase.sql
}
apply_migrations() {
  for f in supabase/migrations/*.sql; do run -d "$1" -f "$f"; done
}

echo '== clean project: apply migrations twice (idempotency) + checks'
fresh_db voxa_mig_clean
apply_migrations voxa_mig_clean
run -d voxa_mig_clean -f supabase/migrations/20261126090000_usage_quota_tables.sql
run -d voxa_mig_clean -f supabase/tests/usage_quota.test.sql

echo '== legacy project: hand-made ai_coach_usage with duplicate rows'
fresh_db voxa_mig_legacy
for f in supabase/migrations/*.sql; do
  [[ "$f" == *20261126090000_usage_quota_tables.sql ]] && run -d voxa_mig_legacy -f supabase/tests/legacy_ai_coach_usage.test.sql
  run -d voxa_mig_legacy -f "$f"
done
run -d voxa_mig_legacy -c "
do \$\$ begin
  assert (select message_count from public.ai_coach_usage where usage_date = '2026-11-25') = 7, 'duplicates not folded';
  assert (select count(*) from public.ai_coach_usage) = 2, 'duplicate rows not removed';
  assert public.increment_ai_coach_usage('00000000-0000-0000-0000-0000000000cc', '2026-11-25') = 8, 'increment after fold';
end \$\$;"
echo 'legacy fold: ok'
echo 'All migration checks passed.'
