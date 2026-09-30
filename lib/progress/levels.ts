export type CoachLevel = {
  name: string;
  minXp: number;
  nextXp: number | null;
  message: string;
};

const LEVELS: CoachLevel[] = [
  { name: 'Foundation', minXp: 0, nextXp: 100, message: 'Build the habit and get comfortable responding.' },
  { name: 'Momentum', minXp: 100, nextXp: 300, message: 'Keep conversations moving with less hesitation.' },
  { name: 'Flow', minXp: 300, nextXp: 700, message: 'Stretch your range and recover smoothly.' },
  { name: 'Range', minXp: 700, nextXp: 1500, message: 'Handle more tones, contexts, and pressure.' },
  { name: 'Presence', minXp: 1500, nextXp: null, message: 'Stay sharp by practicing real-world situations.' },
];

export function getCoachLevel(xpRaw: number): {
  current: CoachLevel;
  next: CoachLevel | null;
  progress: number;
  remainingXp: number;
} {
  const xp = Math.max(0, Math.floor(xpRaw || 0));
  let current = LEVELS[0];

  for (const level of LEVELS) {
    if (xp >= level.minXp) current = level;
  }

  const currentIndex = LEVELS.indexOf(current);
  const next = LEVELS[currentIndex + 1] ?? null;

  if (!next) {
    return { current, next: null, progress: 1, remainingXp: 0 };
  }

  const span = Math.max(1, next.minXp - current.minXp);
  const into = Math.max(0, xp - current.minXp);

  return {
    current,
    next,
    progress: Math.min(1, into / span),
    remainingXp: Math.max(0, next.minXp - xp),
  };
}
