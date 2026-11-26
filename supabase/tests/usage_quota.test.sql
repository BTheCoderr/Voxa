-- Regression checks for 20261126114022_usage_quota_tables.sql. Run after all migrations.
\set ON_ERROR_STOP on

insert into auth.users (id) values
  ('00000000-0000-0000-0000-00000000000a'),
  ('00000000-0000-0000-0000-00000000000b');

-- 1. Atomic increment starts at 1 and counts up per user/day.
set role service_role;
do $$
declare n integer;
begin
  n := public.increment_ai_coach_usage('00000000-0000-0000-0000-00000000000a', '2026-11-26');
  assert n = 1, format('first increment returned %s', n);
  n := public.increment_ai_coach_usage('00000000-0000-0000-0000-00000000000a', '2026-11-26');
  assert n = 2, format('second increment returned %s', n);
  n := public.increment_ai_coach_usage('00000000-0000-0000-0000-00000000000a', '2026-11-27');
  assert n = 1, 'new day must start at 1';
  n := public.increment_ai_coach_usage('00000000-0000-0000-0000-00000000000b', '2026-11-26');
  assert n = 1, 'users are counted separately';
end $$;

insert into public.realtime_session_usage (user_id, scenario_id)
values ('00000000-0000-0000-0000-00000000000a', 'job_interview');

-- 1b. Session counter shares the day row with the message counter.
do $$
declare n integer;
begin
  n := public.increment_ai_coach_session('00000000-0000-0000-0000-00000000000a', '2026-11-26');
  assert n = 1, format('first session returned %s', n);
  n := public.increment_ai_coach_session('00000000-0000-0000-0000-00000000000a', '2026-11-26');
  assert n = 2, format('second session returned %s', n);
  assert (select message_count from public.ai_coach_usage
          where user_id = '00000000-0000-0000-0000-00000000000a' and usage_date = '2026-11-26') = 2,
    'session increments must not touch message_count';
  n := public.increment_ai_coach_session('00000000-0000-0000-0000-00000000000b', '2026-11-28');
  assert n = 1, 'session on a fresh day row';
  assert (select message_count from public.ai_coach_usage
          where user_id = '00000000-0000-0000-0000-00000000000b' and usage_date = '2026-11-28') = 0,
    'fresh session row starts with zero messages';
end $$;

-- 1c. TTS quota: request and character limits, atomic and all-or-nothing.
do $$
declare ok boolean;
begin
  ok := public.consume_tts_quota('00000000-0000-0000-0000-00000000000a', '2026-11-26', 400, 3, 1000);
  assert ok, 'first request allowed';
  ok := public.consume_tts_quota('00000000-0000-0000-0000-00000000000a', '2026-11-26', 500, 3, 1000);
  assert ok, 'second request allowed (900 chars)';
  ok := public.consume_tts_quota('00000000-0000-0000-0000-00000000000a', '2026-11-26', 200, 3, 1000);
  assert not ok, 'char limit must reject 1100 > 1000';
  assert (select char_count from public.tts_usage where user_id = '00000000-0000-0000-0000-00000000000a'
          and usage_date = '2026-11-26') = 900, 'rejected request must not be counted';
  ok := public.consume_tts_quota('00000000-0000-0000-0000-00000000000a', '2026-11-26', 100, 3, 1000);
  assert ok, 'third request fits exactly';
  ok := public.consume_tts_quota('00000000-0000-0000-0000-00000000000a', '2026-11-26', 0, 3, 1000);
  assert not ok, 'request limit must reject a 4th request';
  ok := public.consume_tts_quota('00000000-0000-0000-0000-00000000000a', '2026-11-27', 400, 3, 1000);
  assert ok, 'new day resets';
end $$;
reset role;

-- 2. Clients (anon / authenticated) can neither read the tables nor call the RPC.
do $$
declare r text;
begin
  foreach r in array array['anon', 'authenticated'] loop
    execute format('set local role %I', r);
    begin
      perform 1 from public.ai_coach_usage;
      raise exception '% can read ai_coach_usage', r;
    exception when insufficient_privilege then null;
    end;
    begin
      perform 1 from public.realtime_session_usage;
      raise exception '% can read realtime_session_usage', r;
    exception when insufficient_privilege then null;
    end;
    begin
      perform 1 from public.tts_usage;
      raise exception '% can read tts_usage', r;
    exception when insufficient_privilege then null;
    end;
    begin
      perform public.consume_tts_quota('00000000-0000-0000-0000-00000000000a', '2026-11-26', 1, 100, 100000);
      raise exception '% can call consume_tts_quota', r;
    exception when insufficient_privilege then null;
    end;
    begin
      perform public.increment_ai_coach_session('00000000-0000-0000-0000-00000000000a', '2026-11-26');
      raise exception '% can call increment_ai_coach_session', r;
    exception when insufficient_privilege then null;
    end;
    begin
      perform public.increment_ai_coach_usage('00000000-0000-0000-0000-00000000000a', '2026-11-26');
      raise exception '% can call increment_ai_coach_usage', r;
    exception when insufficient_privilege then null;
    end;
    reset role;
  end loop;
end $$;

-- 3. RLS is on for both tables.
do $$ begin
  assert (select bool_and(relrowsecurity) from pg_class
          where oid in ('public.ai_coach_usage'::regclass, 'public.realtime_session_usage'::regclass,
                        'public.tts_usage'::regclass)),
    'RLS must be enabled';
end $$;

-- 4. Deleting the auth user cascades every user-owned row (account deletion).
insert into public.conversations (user_id, scenario_id, scenario_title, learning_path, user_level)
values ('00000000-0000-0000-0000-00000000000a', 'job_interview', 'Job interview', 'business_english', 'beginner');
delete from auth.users where id = '00000000-0000-0000-0000-00000000000a';
do $$ begin
  assert not exists (select 1 from public.ai_coach_usage where user_id = '00000000-0000-0000-0000-00000000000a'), 'ai_coach_usage not cascaded';
  assert not exists (select 1 from public.realtime_session_usage where user_id = '00000000-0000-0000-0000-00000000000a'), 'realtime_session_usage not cascaded';
  assert not exists (select 1 from public.tts_usage where user_id = '00000000-0000-0000-0000-00000000000a'), 'tts_usage not cascaded';
  assert not exists (select 1 from public.profiles where id = '00000000-0000-0000-0000-00000000000a'), 'profiles not cascaded';
  assert not exists (select 1 from public.conversations where user_id = '00000000-0000-0000-0000-00000000000a'), 'conversations not cascaded';
  assert exists (select 1 from public.ai_coach_usage where user_id = '00000000-0000-0000-0000-00000000000b'), 'other users untouched';
end $$;

\echo 'usage_quota.test.sql: all checks passed'
