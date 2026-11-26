-- Assertions after all migrations ran on the production-shaped database.
\set ON_ERROR_STOP on
do $$
declare ok boolean;
begin
  -- legacy column and data preserved
  assert exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'tts_usage' and column_name = 'play_count'),
    'play_count must be preserved';
  assert (select play_count from public.tts_usage
          where user_id = '00000000-0000-0000-0000-0000000000d1' and usage_date = '2026-11-20') = 5,
    'legacy row must be preserved';
  -- duplicates folded to one row, orphan removed
  assert (select count(*) from public.tts_usage where user_id = '00000000-0000-0000-0000-0000000000d2') = 1,
    'duplicate day rows must be folded';
  assert not exists (select 1 from public.tts_usage where user_id = '00000000-0000-0000-0000-0000000000ee'),
    'orphan rows must be removed before adding the FK';

  -- consume_tts_quota works on the legacy table (insert path needs play_count default)
  set local role service_role;
  ok := public.consume_tts_quota('00000000-0000-0000-0000-0000000000d1', '2026-11-26', 300, 2, 500);
  assert ok, 'first reservation on legacy table';
  ok := public.consume_tts_quota('00000000-0000-0000-0000-0000000000d1', '2026-11-26', 300, 2, 500);
  assert not ok, 'char cap enforced on legacy table';
  ok := public.consume_tts_quota('00000000-0000-0000-0000-0000000000d1', '2026-11-26', 100, 2, 500);
  assert ok, 'second reservation fits';
  ok := public.consume_tts_quota('00000000-0000-0000-0000-0000000000d1', '2026-11-26', 1, 2, 500);
  assert not ok, 'request cap enforced on legacy table';
  reset role;
  assert (select play_count from public.tts_usage
          where user_id = '00000000-0000-0000-0000-0000000000d1' and usage_date = '2026-11-26') = 0,
    'new rows default play_count to 0';

  -- coach RPCs on the hand-made ai_coach_usage
  assert public.increment_ai_coach_usage('00000000-0000-0000-0000-0000000000cc', '2026-11-25') = 8, 'message increment after fold';
  assert public.increment_ai_coach_session('00000000-0000-0000-0000-0000000000cc', '2026-11-25') = 1, 'session_count added';

  -- security
  assert (select relrowsecurity from pg_class where oid = 'public.tts_usage'::regclass), 'RLS on tts_usage';
  assert not has_table_privilege('anon', 'public.tts_usage', 'select'), 'anon must not read tts_usage';
  assert not has_table_privilege('authenticated', 'public.tts_usage', 'select'), 'authenticated must not read tts_usage';

  -- account deletion cascades tts_usage now that the FK exists
  delete from auth.users where id = '00000000-0000-0000-0000-0000000000d1';
  assert not exists (select 1 from public.tts_usage where user_id = '00000000-0000-0000-0000-0000000000d1'),
    'tts_usage must cascade from auth.users';
end $$;
\echo 'prod_shape.checks.sql: all checks passed'
