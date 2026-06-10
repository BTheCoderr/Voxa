import { Audio } from 'expo-av';

import { env } from '@/lib/env';
import type { ApiLearningPath } from '@/lib/realtime/learningPath';
import { supabase } from '@/lib/supabase/client';
import { resolveVoiceId, textForTts, VOXA_VOICE_TEST_SENTENCE } from '@/lib/tts/voices';

export const TTS_UNAVAILABLE_USER_MESSAGE =
  'Voice playback is temporarily unavailable. You can continue practicing by text.';

export type TtsResponse = {
  audioBase64: string;
  contentType: string;
};

export type TtsHealthStatus = {
  configured: boolean;
  hasKey: boolean;
  enabled?: boolean;
  available?: boolean;
  providerReady?: boolean;
  mode: string;
  keyPrefix?: string | null;
  defaultVoiceId?: string;
  defaultModel?: string;
};

type ErrorBody = { error?: string; code?: string; message?: string };

const TTS_PROVIDER_UNAVAILABLE_CODES = new Set([
  'tts_provider_auth',
  'tts_provider_quota',
  'tts_provider_error',
  'tts_error',
  'tts_rate_limited',
  'tts_disabled',
  'tts_quota_error',
  'server_misconfigured',
]);

/** Whether the TTS health endpoint reports playback is ready. */
export function isTtsPlaybackAvailable(health: TtsHealthStatus | null | undefined): boolean {
  if (!health) return false;
  if (typeof health.available === 'boolean') return health.available;
  if (typeof health.providerReady === 'boolean') {
    return health.providerReady && health.hasKey && health.enabled !== false;
  }
  return Boolean(health.configured && health.hasKey && health.enabled !== false);
}

/** User-facing TTS error copy — never exposes provider or config details. */
export function getTtsUserErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);

  if (raw.includes('not set up')) {
    return TTS_UNAVAILABLE_USER_MESSAGE;
  }
  if (raw.includes('Daily voice playback limit reached')) {
    return 'Daily voice playback limit reached. You can continue practicing by text.';
  }
  if (raw.includes('sign in again') || raw.includes('Sign in')) {
    return 'Please sign in again.';
  }
  if (
    raw.includes(TTS_UNAVAILABLE_USER_MESSAGE) ||
    raw.includes('temporarily unavailable') ||
    raw.includes('Could not play voice')
  ) {
    return TTS_UNAVAILABLE_USER_MESSAGE;
  }
  return TTS_UNAVAILABLE_USER_MESSAGE;
}

function buildAuthHeaders(accessToken: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };
  if (env.supabaseAnonKey) {
    headers.apikey = env.supabaseAnonKey;
  }
  return headers;
}

function buildHealthHeaders(authToken?: string): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = authToken?.trim() || env.supabaseAnonKey;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (env.supabaseAnonKey) {
    headers.apikey = env.supabaseAnonKey;
  }
  return headers;
}

/** Prefer a fresh Supabase session token (auto-refreshed by supabase-js). */
async function resolveAccessToken(fallbackToken?: string): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const fresh = data.session?.access_token?.trim();
  if (fresh) return fresh;
  return fallbackToken?.trim() ?? '';
}

function throwTtsHttpError(res: Response, json: ErrorBody | undefined): never {
  const code = typeof json?.code === 'string' ? json.code : undefined;

  if (code === 'tts_daily_limit') {
    throw new Error('Daily voice playback limit reached. You can continue practicing by text.');
  }

  if (code === 'unauthorized') {
    throw new Error('Please sign in again.');
  }

  if (code && TTS_PROVIDER_UNAVAILABLE_CODES.has(code)) {
    throw new Error(TTS_UNAVAILABLE_USER_MESSAGE);
  }

  if (res.status === 401 || res.status === 403) {
    throw new Error('Please sign in again.');
  }

  throw new Error(TTS_UNAVAILABLE_USER_MESSAGE);
}

/** GET elevenlabs-tts?health=1 — safe TTS status (no full keys). */
export async function fetchTtsHealth(authToken?: string): Promise<TtsHealthStatus | null> {
  if (!env.elevenLabsTtsUrl) return null;

  const url = `${env.elevenLabsTtsUrl}${env.elevenLabsTtsUrl.includes('?') ? '&' : '?'}health=1`;

  try {
    const res = await fetch(url, { method: 'GET', headers: buildHealthHeaders(authToken) });
    if (!res.ok) return null;
    return (await res.json()) as TtsHealthStatus;
  } catch {
    return null;
  }
}

/**
 * Calls the `elevenlabs-tts` Edge Function. Key stays server-side.
 * Sends Authorization + apikey headers required when verify_jwt = true.
 */
export async function fetchTtsAudio(
  input: {
    text: string;
    scenarioId: string;
    learningPath: ApiLearningPath;
    voiceId?: string;
  },
  authToken?: string,
): Promise<TtsResponse> {
  if (!env.elevenLabsTtsUrl) {
    throw new Error('Voice playback is not set up yet.');
  }

  const accessToken = await resolveAccessToken(authToken);
  if (!accessToken) {
    throw new Error('Please sign in again.');
  }

  const res = await fetch(env.elevenLabsTtsUrl, {
    method: 'POST',
    headers: buildAuthHeaders(accessToken),
    body: JSON.stringify({
      text: textForTts(input.text),
      voiceId: input.voiceId ?? resolveVoiceId(input.learningPath),
      scenarioId: input.scenarioId,
      learningPath: input.learningPath,
    }),
  });

  const raw = await res.text();
  let json: ErrorBody | undefined;
  try {
    json = raw ? (JSON.parse(raw) as ErrorBody) : undefined;
  } catch {
    json = undefined;
  }

  if (!res.ok) {
    throwTtsHttpError(res, json);
  }

  const body = json as Record<string, unknown> | undefined;
  const audioBase64 = body?.audioBase64;
  const contentType = body?.contentType;
  if (typeof audioBase64 !== 'string' || !audioBase64) {
    throw new Error(TTS_UNAVAILABLE_USER_MESSAGE);
  }

  return {
    audioBase64,
    contentType: typeof contentType === 'string' ? contentType : 'audio/mpeg',
  };
}

/** Short fixed sentence for diagnostics / voice test. */
export async function fetchTtsTestAudio(authToken?: string): Promise<TtsResponse> {
  return fetchTtsAudio(
    {
      text: VOXA_VOICE_TEST_SENTENCE,
      scenarioId: 'voice_test',
      learningPath: 'business_english',
    },
    authToken,
  );
}

let activeSound: Audio.Sound | null = null;

/** Play base64 MP3; stops any prior playback. */
export async function playBase64Audio(audioBase64: string, contentType = 'audio/mpeg'): Promise<void> {
  if (activeSound) {
    try {
      await activeSound.stopAsync();
      await activeSound.unloadAsync();
    } catch {
      /* ignore */
    }
    activeSound = null;
  }

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  });

  const { sound } = await Audio.Sound.createAsync(
    { uri: `data:${contentType};base64,${audioBase64}` },
    { shouldPlay: true },
  );
  activeSound = sound;

  sound.setOnPlaybackStatusUpdate((status) => {
    if (status.isLoaded && status.didJustFinish) {
      void sound.unloadAsync();
      if (activeSound === sound) activeSound = null;
    }
  });
}

export async function stopTtsPlayback(): Promise<void> {
  if (!activeSound) return;
  try {
    await activeSound.stopAsync();
    await activeSound.unloadAsync();
  } catch {
    /* ignore */
  }
  activeSound = null;
}
