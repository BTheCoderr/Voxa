import { env } from '@/lib/env';

export type AiPracticeMode = 'text' | 'voice';

export function getAiPracticeMode(): AiPracticeMode {
  return env.aiMode;
}

export function isTextPracticeMode(): boolean {
  return env.aiMode === 'text';
}

export function isVoicePracticeMode(): boolean {
  return env.aiMode === 'voice';
}
