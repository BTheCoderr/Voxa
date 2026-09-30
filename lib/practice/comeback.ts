import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ScenarioId } from '@/constants/scenarios';
import type { WeeklyCoachPlan, WeeklyCoachPlanItem } from '@/lib/progress/weeklyCoachPlan';

const DISMISS_KEY = '@voxa/retention/v1/dismissed';
const ENABLED_KEY = '@voxa/retention/v1/enabled';

export type ComebackNudgeKind =
  | 'one_rep_left'
  | 'week_at_risk'
  | 'streak_at_risk'
  | 'quiet_comeback'
  | 'start_week';

export type ComebackNudge = {
  id: string;
  kind: ComebackNudgeKind;
  eyebrow: string;
  title: string;
  body: string;
  actionLabel: string;
  scenarioId: ScenarioId;
  focus?: string;
  mission?: string;
  weekKey: string;
};

type BuildComebackArgs = {
  weeklyPlan: WeeklyCoachPlan | null;
  streak: number;
  lastActivityDay?: string | null;
  now?: Date;
  fallbackScenarioId?: ScenarioId | null;
};

type DismissedState = {
  id: string;
  dayKey: string;
};

function localDayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDayKey(value?: string | null): Date | null {
  if (!value) return null;

  const localMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (localMatch) {
    const [, y, m, d] = localMatch;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function daysSince(value?: string | null, now = new Date()): number | null {
  const parsed = parseDayKey(value);
  if (!parsed) return null;

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const then = new Date(parsed);
  then.setHours(0, 0, 0, 0);

  return Math.max(0, Math.floor((today.getTime() - then.getTime()) / 86_400_000));
}

function incompleteItems(plan: WeeklyCoachPlan | null): WeeklyCoachPlanItem[] {
  return plan?.items.filter((item) => !item.completed) ?? [];
}

function nudgeFromItem(
  kind: ComebackNudgeKind,
  plan: WeeklyCoachPlan,
  item: WeeklyCoachPlanItem,
  copy: Pick<ComebackNudge, 'eyebrow' | 'title' | 'body' | 'actionLabel'>,
): ComebackNudge {
  return {
    id: `${plan.weekKey}:${kind}:${item.id}`,
    kind,
    ...copy,
    scenarioId: item.scenarioId,
    focus: item.focus,
    mission: item.mission,
    weekKey: plan.weekKey,
  };
}

export function buildComebackNudge({
  weeklyPlan,
  streak,
  lastActivityDay,
  now = new Date(),
  fallbackScenarioId,
}: BuildComebackArgs): ComebackNudge | null {
  const remaining = incompleteItems(weeklyPlan);
  const inactiveDays = daysSince(lastActivityDay, now);
  const day = now.getDay();
  const isFridayOrLater = day === 5 || day === 6 || day === 0;
  const isMondayOrTuesday = day === 1 || day === 2;

  if (weeklyPlan && remaining.length === 1) {
    return nudgeFromItem('one_rep_left', weeklyPlan, remaining[0]!, {
      eyebrow: 'One rep left',
      title: 'Finish your weekly plan with one conversation.',
      body: `${remaining[0]!.scenarioTitle} is the last planned rep standing between you and a complete week.`,
      actionLabel: 'Finish the week',
    });
  }

  if (weeklyPlan && remaining.length >= 2 && isFridayOrLater) {
    return nudgeFromItem('week_at_risk', weeklyPlan, remaining[0]!, {
      eyebrow: 'Weekly plan',
      title: `${remaining.length} reps are still open this week.`,
      body: 'Start one now. Voxa will keep the rest of the plan exactly where it is instead of reshuffling it.',
      actionLabel: 'Do one rep now',
    });
  }

  if (
    weeklyPlan &&
    remaining.length > 0 &&
    streak > 0 &&
    inactiveDays === 1
  ) {
    return nudgeFromItem('streak_at_risk', weeklyPlan, remaining[0]!, {
      eyebrow: 'Protect the habit',
      title: `Your ${streak}-day rhythm needs one rep today.`,
      body: 'A short planned session is enough. You do not need a marathon practice day to keep momentum moving.',
      actionLabel: 'Protect my streak',
    });
  }

  if (weeklyPlan && remaining.length > 0 && inactiveDays !== null && inactiveDays >= 3) {
    return nudgeFromItem('quiet_comeback', weeklyPlan, remaining[0]!, {
      eyebrow: 'Easy comeback',
      title: 'No catch-up session required.',
      body: `It has been ${inactiveDays} days since your last completed practice. Start with one planned rep and call that a win.`,
      actionLabel: 'Ease back in',
    });
  }

  if (weeklyPlan && remaining.length > 0 && weeklyPlan.completedCount === 0 && isMondayOrTuesday) {
    return nudgeFromItem('start_week', weeklyPlan, remaining[0]!, {
      eyebrow: 'Start the week',
      title: 'One early rep makes the rest of the week easier.',
      body: 'Your plan is already built. Start with the first focused conversation and leave room for the other reps later.',
      actionLabel: 'Start rep 1',
    });
  }

  if (!weeklyPlan && fallbackScenarioId && inactiveDays !== null && inactiveDays >= 3) {
    const weekKey = localDayKey(now).slice(0, 7);
    return {
      id: `${weekKey}:quiet_comeback:${fallbackScenarioId}`,
      kind: 'quiet_comeback',
      eyebrow: 'Easy comeback',
      title: 'Start with one conversation.',
      body: `It has been ${inactiveDays} days since your last practice. One short rep is enough to restart the habit.`,
      actionLabel: 'Practice now',
      scenarioId: fallbackScenarioId,
      weekKey,
    };
  }

  return null;
}

export async function isComebackNudgeDismissedToday(
  nudge: ComebackNudge,
  now = new Date(),
): Promise<boolean> {
  const raw = await AsyncStorage.getItem(DISMISS_KEY);
  if (!raw) return false;

  try {
    const parsed = JSON.parse(raw) as DismissedState;
    return parsed.dayKey === localDayKey(now);
  } catch {
    return false;
  }
}

export async function dismissComebackNudgeToday(
  nudge: ComebackNudge,
  now = new Date(),
): Promise<void> {
  const payload: DismissedState = {
    id: nudge.id,
    dayKey: localDayKey(now),
  };
  await AsyncStorage.setItem(DISMISS_KEY, JSON.stringify(payload));
}


export async function getComebackNudgesEnabled(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(ENABLED_KEY);
  return raw !== 'false';
}

export async function setComebackNudgesEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(ENABLED_KEY, enabled ? 'true' : 'false');
}
