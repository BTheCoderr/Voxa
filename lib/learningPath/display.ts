import type { LaunchLanguage } from '@/constants/scenarios';
import type { ApiLearningPath } from '@/lib/realtime/learningPath';
import { toApiLearningPath } from '@/lib/realtime/learningPath';

/** Default when user has not completed onboarding language step. */
export const DEFAULT_LAUNCH_LANGUAGE: LaunchLanguage = 'english_business';

export function learningPathLabel(path: ApiLearningPath): string {
  switch (path) {
    case 'business_english':
      return 'Business English';
    case 'spanish':
      return 'Spanish';
    case 'mandarin':
      return 'Mandarin';
  }
}

export function launchLanguageLabel(lang: LaunchLanguage): string {
  return learningPathLabel(toApiLearningPath(lang));
}

export function textPracticeOverline(path: ApiLearningPath): string {
  return `Text Practice · ${learningPathLabel(path)}`;
}

export function parseApiLearningPath(raw?: string | null): ApiLearningPath | null {
  if (raw === 'business_english' || raw === 'spanish' || raw === 'mandarin') {
    return raw;
  }
  return null;
}
