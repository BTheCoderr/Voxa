import Constants, { ExecutionEnvironment } from 'expo-constants';

type AudioStreamModule = typeof import('@edkimmel/expo-audio-stream');

let cached: AudioStreamModule | null | undefined;

function isExpoGoNoNativeAudio(): boolean {
  if (Constants.appOwnership === 'expo') return true;
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return true;
  return false;
}

/**
 * `@edkimmel/expo-audio-stream` registers native code. Expo Go does not include it; requiring
 * the package runs `requireNativeModule` at load time and throws.
 */
export function getAudioStreamModule(): AudioStreamModule | null {
  if (cached !== undefined) return cached;
  if (isExpoGoNoNativeAudio()) {
    cached = null;
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('@edkimmel/expo-audio-stream') as AudioStreamModule;
    return cached;
  } catch {
    cached = null;
    return null;
  }
}
