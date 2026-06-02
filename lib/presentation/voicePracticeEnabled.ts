import { isVoicePracticeMode } from '@/lib/ai/mode';

import { showUnreleasedFeatures } from '@/lib/presentation/showUnreleasedFeatures';

/**
 * Live OpenAI Realtime voice sessions — internal/dev and screenshot builds only.
 * Production App Store builds use text practice + optional TTS playback.
 */
export function isLiveVoicePracticeAvailable(): boolean {
  return showUnreleasedFeatures() && isVoicePracticeMode();
}
