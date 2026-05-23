import { env } from '@/lib/env';

/** When false, guided onboarding and lesson map entry points are hidden. Quick Practice unchanged. */
export function isGuidedLessonsEnabled(): boolean {
  return env.guidedLessonsEnabled;
}
