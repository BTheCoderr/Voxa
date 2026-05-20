import type { ApiLearningPath } from '@/lib/realtime/learningPath';

/**
 * Sarah — premade voice that works on ElevenLabs free-tier API access.
 * (Rachel and other “library” premade voices require a paid plan for API use.)
 * @see https://elevenlabs.io/docs/api-reference/text-to-speech
 */
export const DEFAULT_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL';

/** Default voice per learning path. */
const VOICES: Record<ApiLearningPath, string> = {
  business_english: DEFAULT_VOICE_ID,
  spanish: DEFAULT_VOICE_ID,
  mandarin: DEFAULT_VOICE_ID,
};

export function resolveVoiceId(learningPath: ApiLearningPath): string {
  return VOICES[learningPath] ?? DEFAULT_VOICE_ID;
}

export const TTS_MAX_CHARS = 500;

/** Fixed sentence for Profile → Test Voxa voice. */
export const VOXA_VOICE_TEST_SENTENCE =
  "Hi, I'm Voxa. Let's practice speaking with confidence.";

/** Trim reply for TTS cost control. */
export function textForTts(reply: string): string {
  const trimmed = reply.trim();
  if (trimmed.length <= TTS_MAX_CHARS) return trimmed;
  return `${trimmed.slice(0, TTS_MAX_CHARS - 1).trim()}…`;
}
