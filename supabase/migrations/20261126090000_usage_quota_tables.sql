-- Usage / quota tables used by Edge Functions.
--
-- `ai_coach_usage` is read and written by `ai-chat-coach` (daily text-coach message quota),
-- and `realtime_session_usage` by `realtime-session` (#23, rolling 24h voice quota), but
-- neither table was defined in the repo's migrations. This makes them reproducible.
--
-- Safe to apply to a project where the tables were created by hand: every statement is
-- idempotent and existing rows are preserved. Only the service role (Edge Functions)
-- reads or writes these tables; clients have no access.

-- ─── Text coach daily message counts ────────────────────────────────────────
create table if not exists public.ai_coach_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  usage_date date not null,
  message_count integer not null default 0 check (message_count >= 0),
  created_at timestamptz not null default now()
);

-- A (user_id, usage_date) unique key is required for the atomic increment below.
-- Fold any duplicate day rows (possible with the old read-then-write increment) first.
do $$
begin
  if not exists (
    select 1
    from pg_index i
    join pg_class t on t.oid = i.indrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'ai_coach_usage'
      and i.indisunique
      and (
        select array_agg(a.attname::text order by a.attname)
        from unnest(i.indkey) k
        join pg_attribute a on a.attrelid = t.oid and a.attnum = k
      ) = array['usage_date', 'user_id']
  ) then
    -- Delete the extra rows first (remembering their counts), then add those counts to
    -- the surviving row. Two statements, because an UPDATE moves a row to a new ctid.
    create temporary table ai_coach_usage_dupes on commit drop as
    with removed as (
      delete from public.ai_coach_usage u
      using (
        select ctid,
               row_number() over (partition by user_id, usage_date order by ctid) as rn
        from public.ai_coach_usage
      ) d
      where u.ctid = d.ctid and d.rn > 1
      returning u.user_id, u.usage_date, u.message_count
    )
    select user_id, usage_date, sum(message_count)::integer as extra
    from removed
    group by user_id, usage_date;

    update public.ai_coach_usage u
    set message_count = u.message_count + d.extra
    from ai_coach_usage_dupes d
    where u.user_id = d.user_id and u.usage_date = d.usage_date;

    create unique index ai_coach_usage_user_date_uidx
      on public.ai_coach_usage (user_id, usage_date);
  end if;
end;
$$;

-- Atomic per-day increment for the service role. plpgsql so the ON CONFLICT target is
-- resolved at call time, not at creation time.
create or replace function public.increment_ai_coach_usage(p_user_id uuid, p_usage_date date)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  next_count integer;
begin
  insert into public.ai_coach_usage as u (user_id, usage_date, message_count)
  values (p_user_id, p_usage_date, 1)
  on conflict (user_id, usage_date)
  do update set message_count = u.message_count + 1
  returning u.message_count into next_count;
  return next_count;
end;
$$;

revoke all on function public.increment_ai_coach_usage(uuid, date) from public;
revoke all on function public.increment_ai_coach_usage(uuid, date) from anon, authenticated;
grant execute on function public.increment_ai_coach_usage(uuid, date) to service_role;

-- ─── Realtime voice session mints (rolling-window quota) ────────────────────
create table if not exists public.realtime_session_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  scenario_id text not null,
  created_at timestamptz not null default now()
);

create index if not exists realtime_session_usage_user_created_idx
  on public.realtime_session_usage (user_id, created_at desc);

-- ─── Lock down: service role only ───────────────────────────────────────────
alter table public.ai_coach_usage enable row level security;
alter table public.realtime_session_usage enable row level security;

revoke all on table public.ai_coach_usage from anon, authenticated;
revoke all on table public.realtime_session_usage from anon, authenticated;

grant select, insert, update, delete on table public.ai_coach_usage to service_role;
grant select, insert, update, delete on table public.realtime_session_usage to service_role;
