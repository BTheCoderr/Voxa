-- Make a pre-existing (hand-made) `public.tts_usage` behave like the table defined in
-- 20261126114022, without touching its existing columns or rows:
--   * (user_id, usage_date) unique key  — consume_tts_quota's ON CONFLICT needs it
--   * legacy NOT NULL columns get a default — consume_tts_quota inserts only
--     (user_id, usage_date), e.g. a legacy `play_count integer not null`
--   * cascade from auth.users            — account deletion
--   * RLS on, service role only
-- No-op on projects where 20261126114022 created the table itself.

do $$
declare
  col record;
  has_unique boolean;
  has_fk boolean;
begin
  if to_regclass('public.tts_usage') is null then
    return;
  end if;

  -- 1. Defaults for legacy NOT NULL columns that consume_tts_quota does not set.
  for col in
    select c.column_name, c.data_type
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.table_name = 'tts_usage'
      and c.is_nullable = 'NO'
      and c.column_default is null
      and c.column_name not in ('user_id', 'usage_date')
      and c.data_type in ('integer', 'bigint', 'smallint', 'numeric')
  loop
    execute format('alter table public.tts_usage alter column %I set default 0', col.column_name);
  end loop;

  -- 2. Unique (user_id, usage_date), folding duplicates of the counters we own first.
  select exists (
    select 1
    from pg_index i
    where i.indrelid = 'public.tts_usage'::regclass
      and i.indisunique
      and (
        select array_agg(a.attname::text order by a.attname)
        from unnest(i.indkey) k
        join pg_attribute a on a.attrelid = i.indrelid and a.attnum = k
      ) = array['usage_date', 'user_id']
  ) into has_unique;

  if not has_unique then
    create temporary table tts_usage_dupes on commit drop as
    with removed as (
      delete from public.tts_usage u
      using (
        select ctid, row_number() over (partition by user_id, usage_date order by ctid) as rn
        from public.tts_usage
      ) d
      where u.ctid = d.ctid and d.rn > 1
      returning u.user_id, u.usage_date, u.request_count, u.char_count
    )
    select user_id, usage_date,
           sum(request_count)::integer as extra_requests,
           sum(char_count)::integer as extra_chars
    from removed
    group by user_id, usage_date;

    update public.tts_usage u
    set request_count = u.request_count + d.extra_requests,
        char_count = u.char_count + d.extra_chars
    from tts_usage_dupes d
    where u.user_id = d.user_id and u.usage_date = d.usage_date;

    create unique index tts_usage_user_date_uidx on public.tts_usage (user_id, usage_date);
  end if;

  -- 3. Cascade from auth.users when no FK on user_id exists (orphans removed first).
  select exists (
    select 1
    from pg_constraint con
    join pg_attribute a on a.attrelid = con.conrelid and a.attnum = any (con.conkey)
    where con.conrelid = 'public.tts_usage'::regclass
      and con.contype = 'f'
      and a.attname = 'user_id'
  ) into has_fk;

  if not has_fk then
    delete from public.tts_usage t
    where not exists (select 1 from auth.users u where u.id = t.user_id);
    alter table public.tts_usage
      add constraint tts_usage_user_id_fkey
      foreign key (user_id) references auth.users (id) on delete cascade;
  end if;
end;
$$;

alter table public.tts_usage enable row level security;
revoke all on table public.tts_usage from anon, authenticated;
grant select, insert, update, delete on table public.tts_usage to service_role;
