import AsyncStorage from '@react-native-async-storage/async-storage';

const XP_KEY = '@voxa/progress/v1/xp';
const STREAK_KEY = '@voxa/progress/v1/streak';
const LAST_DAY_KEY = '@voxa/progress/v1/last_yyyy_mm_dd';

function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isYesterdayKey(prev: string, today: string): boolean {
  const a = new Date(`${prev}T00:00:00`);
  const b = new Date(`${today}T00:00:00`);
  const diffDays = Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}

export type LocalProgressSnapshot = {
  xp: number;
  streak: number;
  lastDay: string | null;
};

export async function loadLocalProgress(): Promise<LocalProgressSnapshot> {
  const [xpRaw, streakRaw, lastDay] = await Promise.all([
    AsyncStorage.getItem(XP_KEY),
    AsyncStorage.getItem(STREAK_KEY),
    AsyncStorage.getItem(LAST_DAY_KEY),
  ]);

  return {
    xp: xpRaw ? Number(xpRaw) : 0,
    streak: streakRaw ? Number(streakRaw) : 0,
    lastDay,
  };
}

/**
 * Call when a speaking session completes successfully.
 * MVP: local-first. Later: sync to Supabase profiles + idempotent server ledger.
 */
export async function recordSessionCompleted(xpDelta: number): Promise<LocalProgressSnapshot> {
  const today = todayKey();
  const prev = await loadLocalProgress();

  let nextStreak = prev.streak;
  if (prev.lastDay === today) {
    nextStreak = prev.streak;
  } else if (!prev.lastDay) {
    nextStreak = 1;
  } else if (isYesterdayKey(prev.lastDay, today)) {
    nextStreak = prev.streak + 1;
  } else {
    nextStreak = 1;
  }

  const nextXp = Math.max(0, prev.xp + xpDelta);

  await Promise.all([
    AsyncStorage.setItem(XP_KEY, String(nextXp)),
    AsyncStorage.setItem(STREAK_KEY, String(nextStreak)),
    AsyncStorage.setItem(LAST_DAY_KEY, today),
  ]);

  return { xp: nextXp, streak: nextStreak, lastDay: today };
}

/** Sync device cache to match Supabase (signed-in source of truth). */
export async function writeLocalProgressMirror(snapshot: LocalProgressSnapshot): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(XP_KEY, String(snapshot.xp)),
    AsyncStorage.setItem(STREAK_KEY, String(snapshot.streak)),
    snapshot.lastDay
      ? AsyncStorage.setItem(LAST_DAY_KEY, snapshot.lastDay)
      : AsyncStorage.removeItem(LAST_DAY_KEY),
  ]);
}
