-- Shipping readiness: RLS ownership, streak dedupe, structured corrections, AI metadata.

-- ─── Helper: conversation belongs to current user ───────────────────────────
create or replace function public.conversation_owned_by_user(p_conversation_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.conversations c
    where c.id = p_conversation_id
      and c.user_id = auth.uid()
  );
$$;

-- ─── Structured corrections ───────────────────────────────────────────────────
alter table public.corrections
  add column if not exists original text not null default '',
  add column if not exists improved text not null default '',
  add column if not exists explanation text not null default '';

-- Backfill legacy rows (body-only) into original for readability.
update public.corrections
set original = body
where original = ''
  and improved = ''
  and explanation = ''
  and body <> '';

alter table public.corrections
  drop constraint if exists corrections_conversation_id_body_key;

create unique index if not exists corrections_conv_original_improved_uidx
  on public.corrections (conversation_id, original, improved);

-- ─── AI provider metadata on sessions ────────────────────────────────────────
alter table public.conversations
  add column if not exists ai_provider_used text,
  add column if not exists ai_used_fallback boolean;

-- ─── One streak event per user per UTC day ───────────────────────────────────
delete from public.streak_events a
using public.streak_events b
where a.user_id = b.user_id
  and a.event_date = b.event_date
  and a.id > b.id;

create unique index if not exists streak_events_user_date_uidx
  on public.streak_events (user_id, event_date);

-- ─── RLS: child rows must belong to an owned conversation ───────────────────
drop policy if exists conversation_messages_select_own on public.conversation_messages;
drop policy if exists conversation_messages_insert_own on public.conversation_messages;
drop policy if exists conversation_messages_update_own on public.conversation_messages;
drop policy if exists conversation_messages_delete_own on public.conversation_messages;

create policy conversation_messages_select_own on public.conversation_messages
  for select using (
    auth.uid() = user_id
    and public.conversation_owned_by_user(conversation_id)
  );

create policy conversation_messages_insert_own on public.conversation_messages
  for insert with check (
    auth.uid() = user_id
    and public.conversation_owned_by_user(conversation_id)
  );

create policy conversation_messages_update_own on public.conversation_messages
  for update using (
    auth.uid() = user_id
    and public.conversation_owned_by_user(conversation_id)
  )
  with check (
    auth.uid() = user_id
    and public.conversation_owned_by_user(conversation_id)
  );

create policy conversation_messages_delete_own on public.conversation_messages
  for delete using (
    auth.uid() = user_id
    and public.conversation_owned_by_user(conversation_id)
  );

drop policy if exists corrections_select_own on public.corrections;
drop policy if exists corrections_insert_own on public.corrections;
drop policy if exists corrections_delete_own on public.corrections;

create policy corrections_select_own on public.corrections
  for select using (
    auth.uid() = user_id
    and public.conversation_owned_by_user(conversation_id)
  );

create policy corrections_insert_own on public.corrections
  for insert with check (
    auth.uid() = user_id
    and public.conversation_owned_by_user(conversation_id)
  );

create policy corrections_delete_own on public.corrections
  for delete using (
    auth.uid() = user_id
    and public.conversation_owned_by_user(conversation_id)
  );

drop policy if exists streak_events_select_own on public.streak_events;
drop policy if exists streak_events_insert_own on public.streak_events;

create policy streak_events_select_own on public.streak_events
  for select using (auth.uid() = user_id);

create policy streak_events_insert_own on public.streak_events
  for insert with check (
    auth.uid() = user_id
    and (
      conversation_id is null
      or public.conversation_owned_by_user(conversation_id)
    )
  );
