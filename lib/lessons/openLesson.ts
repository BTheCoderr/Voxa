import { router } from 'expo-router';

import type { LaunchLanguage, ScenarioId } from '@/constants/scenarios';
import { isTextPracticeMode } from '@/lib/ai/mode';
import { toApiLearningPath } from '@/lib/realtime/learningPath';

export function openLessonPractice(
  scenarioId: ScenarioId,
  language: LaunchLanguage,
  lessonId: string,
): void {
  const path = toApiLearningPath(language);

  if (isTextPracticeMode()) {
    router.push({
      pathname: '/(app)/text-practice/[scenarioId]',
      params: { scenarioId, path, lessonId },
    });
    return;
  }

  router.push({
    pathname: '/(app)/conversation/[scenarioId]',
    params: { scenarioId, path, lessonId },
  });
}

export function openImmersivePractice(lessonId: string): void {
  router.push({
    pathname: '/(app)/immersive-practice/[lessonId]',
    params: { lessonId },
  });
}

export function openLessonDetail(lessonId: string): void {
  router.push({
    pathname: '/(app)/lesson/[lessonId]',
    params: { lessonId },
  });
}

export function openLessonMap(): void {
  router.push('/(app)/lesson-map');
}
