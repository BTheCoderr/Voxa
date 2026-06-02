-- Daily ElevenLabs TTS play quota per authenticated user (enforced in elevenlabs-tts Edge Function).

create table public.tts_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  usage_date date not null default (timezone('utc', now()))::date,
  play_count integer not null default 0 check (play_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date)
);

create index tts_usage_user_date_idx on public.tts_usage (user_id, usage_date desc);

create trigger tts_usage_set_updated_at
  before update on public.tts_usage
  for each row execute procedure public.set_updated_at();

alter table public.tts_usage enable row level security;

-- Users may read their own usage (optional transparency); writes only via service role in Edge Function.
create policy tts_usage_select_own on public.tts_usage
  for select using (auth.uid() = user_id);

revoke all on table public.tts_usage from anon;
grant select on table public.tts_usage to authenticated;

-- Service role (Edge Functions) bypasses RLS for increment.
