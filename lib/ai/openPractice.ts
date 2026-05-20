import { router } from 'expo-router';

import type { LaunchLanguage, ScenarioId } from '@/constants/scenarios';
import { isTextPracticeMode } from '@/lib/ai/mode';
import { toApiLearningPath } from '@/lib/realtime/learningPath';

/** Opens text or voice practice based on EXPO_PUBLIC_AI_MODE. */
export function openScenarioPractice(scenarioId: ScenarioId, language: LaunchLanguage): void {
  const path = toApiLearningPath(language);

  if (isTextPracticeMode()) {
    router.push({
      pathname: '/(app)/text-practice/[scenarioId]',
      params: { scenarioId, path },
    });
    return;
  }

  router.push({
    pathname: '/(app)/conversation/[scenarioId]',
    params: { scenarioId, path },
  });
}

/** Voice (OpenAI Realtime) — premium / experimental. */
export function openVoicePractice(scenarioId: ScenarioId, language: LaunchLanguage): void {
  router.push({
    pathname: '/(app)/conversation/[scenarioId]',
    params: { scenarioId, path: toApiLearningPath(language) },
  });
}
