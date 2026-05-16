-- Voxa voice sessions, transcripts, corrections, progress, streaks.
-- RLS: authenticated users only, own rows. Anon has no table access. Service role bypasses RLS.

create extension if not exists "pgcrypto";

-- ─── Profiles (1:1 with auth.users) ─────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Aggregate XP + streak (per user) ───────────────────────────────────────
create table public.user_progress (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  total_xp integer not null default 0 check (total_xp >= 0),
  current_streak integer not null default 0 check (current_streak >= 0),
  last_activity_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Voice conversation sessions ────────────────────────────────────────────
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  scenario_id text not null,
  scenario_title text not null,
  learning_path text not null,
  user_level text not null,
  status text not null default 'active' check (status in ('active', 'completed', 'aborted')),
  summary text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  xp_awarded integer not null default 0 check (xp_awarded >= 0)
);

create index conversations_user_started_idx on public.conversations (user_id, started_at desc);

-- ─── Transcript lines (streaming-friendly upsert) ────────────────────────────
create table public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  body text not null default '',
  client_message_id text not null,
  is_final boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (conversation_id, client_message_id)
);

create index conversation_messages_conv_idx on public.conversation_messages (conversation_id, created_at);

-- ─── Soft correction snippets ────────────────────────────────────────────────
create table public.corrections (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  unique (conversation_id, body)
);

-- ─── Streak audit (optional; streak source of truth is user_progress) ─────
create table public.streak_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_date date not null,
  conversation_id uuid references public.conversations (id) on delete set null,
  created_at timestamptz not null default now()
);

create index streak_events_user_date_idx on public.streak_events (user_id, event_date desc);

-- ─── updated_at maintenance ───────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger user_progress_set_updated_at
  before update on public.user_progress
  for each row execute procedure public.set_updated_at();

create trigger conversation_messages_set_updated_at
  before update on public.conversation_messages
  for each row execute procedure public.set_updated_at();

-- ─── New auth users: profile + progress rows ─────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  insert into public.user_progress (user_id) values (new.id);
  return new;
exception
  when unique_violation then
    return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Atomic XP increment (invoker = subject to RLS) ─────────────────────────
create or replace function public.increment_user_xp(p_user_id uuid, p_delta integer)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if p_delta is null or p_delta <= 0 then
    return;
  end if;
  update public.user_progress
  set total_xp = total_xp + p_delta
  where user_id = p_user_id;
end;
$$;

-- ─── Backfill for existing auth users ────────────────────────────────────────
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

insert into public.user_progress (user_id)
select p.id
from public.profiles p
where not exists (select 1 from public.user_progress u where u.user_id = p.id);

-- ─── RLS ────────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.user_progress enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_messages enable row level security;
alter table public.corrections enable row level security;
alter table public.streak_events enable row level security;

create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);

create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = id);

create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy user_progress_select_own on public.user_progress
  for select using (auth.uid() = user_id);

create policy user_progress_insert_own on public.user_progress
  for insert with check (auth.uid() = user_id);

create policy user_progress_update_own on public.user_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy conversations_select_own on public.conversations
  for select using (auth.uid() = user_id);

create policy conversations_insert_own on public.conversations
  for insert with check (auth.uid() = user_id);

create policy conversations_update_own on public.conversations
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy conversations_delete_own on public.conversations
  for delete using (auth.uid() = user_id);

create policy conversation_messages_select_own on public.conversation_messages
  for select using (auth.uid() = user_id);

create policy conversation_messages_insert_own on public.conversation_messages
  for insert with check (auth.uid() = user_id);

create policy conversation_messages_update_own on public.conversation_messages
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy conversation_messages_delete_own on public.conversation_messages
  for delete using (auth.uid() = user_id);

create policy corrections_select_own on public.corrections
  for select using (auth.uid() = user_id);

create policy corrections_insert_own on public.corrections
  for insert with check (auth.uid() = user_id);

create policy corrections_delete_own on public.corrections
  for delete using (auth.uid() = user_id);

create policy streak_events_select_own on public.streak_events
  for select using (auth.uid() = user_id);

create policy streak_events_insert_own on public.streak_events
  for insert with check (auth.uid() = user_id);

-- ─── Grants: authenticated only; no anon table access ─────────────────────
revoke all on table public.profiles from anon;
revoke all on table public.user_progress from anon;
revoke all on table public.conversations from anon;
revoke all on table public.conversation_messages from anon;
revoke all on table public.corrections from anon;
revoke all on table public.streak_events from anon;

grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.user_progress to authenticated;
grant select, insert, update, delete on table public.conversations to authenticated;
grant select, insert, update, delete on table public.conversation_messages to authenticated;
grant select, insert, delete on table public.corrections to authenticated;
grant select, insert on table public.streak_events to authenticated;

grant execute on function public.increment_user_xp(uuid, integer) to authenticated;
