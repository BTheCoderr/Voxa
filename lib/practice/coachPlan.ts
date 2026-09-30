import AsyncStorage from '@react-native-async-storage/async-storage';

import type { SessionCoachReview } from '@/lib/ai/providers/types';

const KEY = '@voxa/coach-plan/v1';

export type PersonalizedMission = {
  scenarioId: string;
  title: string;
  instruction: string;
  focus: string;
  createdAt: string;
};

export async function savePersonalizedMission(review: SessionCoachReview): Promise<PersonalizedMission> {
  const mission: PersonalizedMission = {
    scenarioId: review.suggestedScenarioId,
    title: review.headline || 'Your next mission',
    instruction: review.nextMission,
    focus: review.focus,
    createdAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(KEY, JSON.stringify(mission));
  return mission;
}

export async function loadPersonalizedMission(): Promise<PersonalizedMission | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersonalizedMission>;
    if (
      typeof parsed.scenarioId !== 'string' ||
      typeof parsed.instruction !== 'string' ||
      typeof parsed.focus !== 'string'
    ) {
      return null;
    }
    return {
      scenarioId: parsed.scenarioId,
      title: typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title : 'Your next mission',
      instruction: parsed.instruction,
      focus: parsed.focus,
      createdAt: typeof parsed.createdAt === 'string' ? parsed.createdAt : new Date(0).toISOString(),
    };
  } catch {
    return null;
  }
}

export async function clearPersonalizedMission(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
