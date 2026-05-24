import type { LaunchLanguage } from '@/constants/scenarios';

export type ApiLearningPath = 'business_english' | 'spanish' | 'mandarin';

/** Maps app onboarding language ids to Edge Function `learningPath` enum. */
export function toApiLearningPath(lang: LaunchLanguage): ApiLearningPath {
  if (lang === 'english_business') {
    return 'business_english';
  }
  return lang;
}

export function fromApiLearningPath(path: ApiLearningPath): LaunchLanguage {
  if (path === 'business_english') {
    return 'english_business';
  }
  return path;
}
