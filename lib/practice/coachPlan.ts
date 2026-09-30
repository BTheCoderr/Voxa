import AsyncStorage from '@react-native-async-storage/async-storage';

import { getScenario } from '@/constants/scenarios';
import type { SessionCoachReview } from '@/lib/ai/providers/types';
import type { LearnerCoachMemory } from '@/lib/progress/coachMemory';
import { coachSkillLabel } from '@/lib/progress/coachSkills';

const KEY = '@voxa/coach-plan/v1';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

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
    const createdAt = typeof parsed.createdAt === 'string' ? parsed.createdAt : new Date(0).toISOString();
    const createdAtMs = Date.parse(createdAt);
    if (!Number.isFinite(createdAtMs) || Date.now() - createdAtMs > MAX_AGE_MS) {
      await AsyncStorage.removeItem(KEY);
      return null;
    }

    return {
      scenarioId: parsed.scenarioId,
      title: typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title : 'Your next mission',
      instruction: parsed.instruction,
      focus: parsed.focus,
      createdAt,
    };
  } catch {
    return null;
  }
}

export async function clearPersonalizedMission(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}


export function buildMissionFromCoachMemory(
  memory: LearnerCoachMemory,
): PersonalizedMission | null {
  const primaryScenarioId = memory.recommendedScenarioIds[0];
  const primaryScenario = primaryScenarioId ? getScenario(primaryScenarioId) : null;

  if (memory.sessionsAnalyzed >= 2 && memory.primaryFocus && primaryScenario) {
    const focusLabel = coachSkillLabel(memory.primaryFocus);
    return {
      scenarioId: primaryScenario.id,
      title: `Build ${focusLabel.toLowerCase()}`,
      instruction: `This is the most repeated focus across your last ${memory.sessionsAnalyzed} coached sessions. Practice it in ${primaryScenario.title.toLowerCase()} and keep the conversation moving.`,
      focus: focusLabel,
      createdAt: new Date().toISOString(),
    };
  }

  const latest = memory.latestReview;
  if (!latest) return null;

  return {
    scenarioId: latest.suggestedScenarioId,
    title: latest.headline,
    instruction: latest.nextMission,
    focus: latest.focus,
    createdAt: new Date().toISOString(),
  };
}
