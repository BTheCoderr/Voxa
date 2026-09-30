import type { Scenario } from '@/constants/scenarios';

function localDayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function utcDayKey(date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function stableDayNumber(key: string): number {
  return key.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
}

export function getDailyMission(scenarios: Scenario[], date = new Date()): Scenario | null {
  if (scenarios.length === 0) return null;
  const index = stableDayNumber(localDayKey(date)) % scenarios.length;
  return scenarios[index] ?? scenarios[0] ?? null;
}

export function wasActiveToday(lastDay?: string | null, date = new Date()): boolean {
  if (!lastDay) return false;
  return lastDay === localDayKey(date) || lastDay === utcDayKey(date);
}
