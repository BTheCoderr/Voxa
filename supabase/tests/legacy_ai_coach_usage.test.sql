-- Simulates a production project where ai_coach_usage was created by hand without a
-- unique key and already holds duplicate day rows. The migration must fold them.
\set ON_ERROR_STOP on
create table public.ai_coach_usage (
  id bigserial primary key,
  user_id uuid not null,
  usage_date date not null,
  message_count integer not null default 0
);
insert into auth.users (id) values ('00000000-0000-0000-0000-0000000000cc');
insert into public.ai_coach_usage (user_id, usage_date, message_count) values
  ('00000000-0000-0000-0000-0000000000cc', '2026-11-25', 3),
  ('00000000-0000-0000-0000-0000000000cc', '2026-11-25', 4),
  ('00000000-0000-0000-0000-0000000000cc', '2026-11-26', 1);
