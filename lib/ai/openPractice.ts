import { router } from 'expo-router';

import type { LaunchLanguage, ScenarioId } from '@/constants/scenarios';
import { isTextPracticeMode } from '@/lib/ai/mode';
import { toApiLearningPath } from '@/lib/realtime/learningPath';

export type PracticeFocusOptions = {
  focus?: string;
  mission?: string;
};

/** Opens text or voice practice based on EXPO_PUBLIC_AI_MODE. */
export function openScenarioPractice(
  scenarioId: ScenarioId,
  language: LaunchLanguage,
  options: PracticeFocusOptions = {},
): void {
  const path = toApiLearningPath(language);
  const sharedParams = {
    scenarioId,
    path,
    ...(options.focus?.trim() ? { focus: options.focus.trim() } : {}),
    ...(options.mission?.trim() ? { mission: options.mission.trim() } : {}),
  };

  if (isTextPracticeMode()) {
    router.push({
      pathname: '/(app)/text-practice/[scenarioId]',
      params: sharedParams,
    });
    return;
  }

  router.push({
    pathname: '/(app)/conversation/[scenarioId]',
    params: sharedParams,
  });
}

/** Voice (OpenAI Realtime) — premium / experimental. */
export function openVoicePractice(scenarioId: ScenarioId, language: LaunchLanguage): void {
  router.push({
    pathname: '/(app)/conversation/[scenarioId]',
    params: { scenarioId, path: toApiLearningPath(language) },
  });
}
