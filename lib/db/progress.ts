import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, UserProgressRow } from './database.types';

function utcTodayKey(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isYesterdayKey(prev: string, today: string): boolean {
  const a = new Date(`${prev}T00:00:00Z`);
  const b = new Date(`${today}T00:00:00Z`);
  const diffDays = Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}

export async function ensureUserProfileRows(client: SupabaseClient<Database>, userId: string): Promise<void> {
  const { error: pErr } = await client.from('profiles').upsert({ id: userId }, { onConflict: 'id', ignoreDuplicates: true });
  if (pErr) throw pErr;

  const { error: uErr } = await client
    .from('user_progress')
    .upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: true });
  if (uErr) throw uErr;
}

export async function updateXp(client: SupabaseClient<Database>, userId: string, delta: number): Promise<void> {
  if (delta <= 0) return;

  await ensureUserProfileRows(client, userId);

  const { error } = await client.rpc('increment_user_xp', { p_user_id: userId, p_delta: delta });
  if (error) throw error;
}

export async function recordStreakEvent(
  client: SupabaseClient<Database>,
  userId: string,
  opts?: { conversationId?: string | null },
): Promise<void> {
  await ensureUserProfileRows(client, userId);

  const today = utcTodayKey();

  const { data: prog, error: readErr } = await client.from('user_progress').select('*').eq('user_id', userId).single();

  if (readErr) throw readErr;

  const last = prog.last_activity_date;

  if (last === today) {
    const { error: upsertErr } = await client.from('streak_events').upsert(
      {
        user_id: userId,
        event_date: today,
        conversation_id: opts?.conversationId ?? null,
      },
      { onConflict: 'user_id,event_date', ignoreDuplicates: true },
    );
    if (upsertErr) throw upsertErr;
    return;
  }

  let nextStreak = prog.current_streak;

  if (!last) {
    nextStreak = 1;
  } else if (isYesterdayKey(last, today)) {
    nextStreak = prog.current_streak + 1;
  } else {
    nextStreak = 1;
  }

  const { error: insErr } = await client.from('streak_events').upsert(
    {
      user_id: userId,
      event_date: today,
      conversation_id: opts?.conversationId ?? null,
    },
    { onConflict: 'user_id,event_date', ignoreDuplicates: true },
  );
  if (insErr) throw insErr;

  const { error: updErr } = await client
    .from('user_progress')
    .update({
      current_streak: nextStreak,
      last_activity_date: today,
    })
    .eq('user_id', userId);

  if (updErr) throw updErr;
}

export async function getUserProgress(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<UserProgressRow | null> {
  await ensureUserProfileRows(client, userId);

  const { data, error } = await client.from('user_progress').select('*').eq('user_id', userId).maybeSingle();

  if (error) throw error;
  return data;
}
