-- Simulates production's hand-made tts_usage (found 2026-11-26): legacy play_count, no
-- request/char counters. Worst case assumed: surrogate key, play_count NOT NULL without a
-- default, no unique (user_id, usage_date), no FK. Production had zero rows; rows here
-- exercise the preserve / fold / orphan paths.
\set ON_ERROR_STOP on
create table public.tts_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  usage_date date not null,
  play_count integer not null,
  created_at timestamptz not null default now()
);
insert into auth.users (id) values
  ('00000000-0000-0000-0000-0000000000d1'),
  ('00000000-0000-0000-0000-0000000000d2');
insert into public.tts_usage (user_id, usage_date, play_count) values
  ('00000000-0000-0000-0000-0000000000d1', '2026-11-20', 5),
  ('00000000-0000-0000-0000-0000000000d2', '2026-11-21', 1),
  ('00000000-0000-0000-0000-0000000000d2', '2026-11-21', 2),
  ('00000000-0000-0000-0000-0000000000ee', '2026-11-21', 9);  -- orphan: no auth user
