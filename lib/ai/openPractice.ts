import { router } from 'expo-router';

import type { LaunchLanguage, ScenarioId } from '@/constants/scenarios';
import { isTextPracticeMode } from '@/lib/ai/mode';
import { isLiveVoicePracticeAvailable } from '@/lib/presentation/voicePracticeEnabled';
import { toApiLearningPath } from '@/lib/realtime/learningPath';

/** Opens text practice (production) or live voice (dev/screenshot only). */
export function openScenarioPractice(scenarioId: ScenarioId, language: LaunchLanguage): void {
  const path = toApiLearningPath(language);

  if (isTextPracticeMode() || !isLiveVoicePracticeAvailable()) {
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

/** Live voice — only when explicitly enabled for dev/screenshot builds. */
export function openVoicePractice(scenarioId: ScenarioId, language: LaunchLanguage): void {
  if (!isLiveVoicePracticeAvailable()) {
    openScenarioPractice(scenarioId, language);
    return;
  }

  router.push({
    pathname: '/(app)/conversation/[scenarioId]',
    params: { scenarioId, path: toApiLearningPath(language) },
  });
}
