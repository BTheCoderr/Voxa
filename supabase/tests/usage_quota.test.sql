-- Regression checks for 20261126090000_usage_quota_tables.sql. Run after all migrations.
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
          where oid in ('public.ai_coach_usage'::regclass, 'public.realtime_session_usage'::regclass)),
    'RLS must be enabled';
end $$;

-- 4. Deleting the auth user cascades every user-owned row (account deletion).
insert into public.conversations (user_id, scenario_id, scenario_title, learning_path, user_level)
values ('00000000-0000-0000-0000-00000000000a', 'job_interview', 'Job interview', 'business_english', 'beginner');
delete from auth.users where id = '00000000-0000-0000-0000-00000000000a';
do $$ begin
  assert not exists (select 1 from public.ai_coach_usage where user_id = '00000000-0000-0000-0000-00000000000a'), 'ai_coach_usage not cascaded';
  assert not exists (select 1 from public.realtime_session_usage where user_id = '00000000-0000-0000-0000-00000000000a'), 'realtime_session_usage not cascaded';
  assert not exists (select 1 from public.profiles where id = '00000000-0000-0000-0000-00000000000a'), 'profiles not cascaded';
  assert not exists (select 1 from public.conversations where user_id = '00000000-0000-0000-0000-00000000000a'), 'conversations not cascaded';
  assert exists (select 1 from public.ai_coach_usage where user_id = '00000000-0000-0000-0000-00000000000b'), 'other users untouched';
end $$;

\echo 'usage_quota.test.sql: all checks passed'
