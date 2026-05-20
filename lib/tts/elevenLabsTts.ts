import { Audio } from 'expo-av';

import { env } from '@/lib/env';
import type { ApiLearningPath } from '@/lib/realtime/learningPath';
import { supabase } from '@/lib/supabase/client';
import { resolveVoiceId, textForTts, VOXA_VOICE_TEST_SENTENCE } from '@/lib/tts/voices';

export type TtsResponse = {
  audioBase64: string;
  contentType: string;
};

export type TtsHealthStatus = {
  configured: boolean;
  hasKey: boolean;
  mode: string;
  keyPrefix?: string | null;
  defaultVoiceId?: string;
  defaultModel?: string;
};

type ErrorBody = { error?: string; code?: string; message?: string };

/** User-facing TTS error copy — maps thrown errors without exposing keys. */
export function getTtsUserErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);

  if (raw.includes('not set up')) {
    return 'Voice playback is not set up yet.';
  }
  if (raw.includes('Voice key is not configured correctly')) {
    return 'Voice key is not configured correctly.';
  }
  if (
    raw.includes('ElevenLabs credits') ||
    raw.includes('paid plan') ||
    raw.includes('tts_provider_quota')
  ) {
    return 'Voice playback needs ElevenLabs credits or a paid plan.';
  }
  if (raw.includes('sign in again')) {
    return 'Please sign in again.';
  }
  return 'Could not play voice right now.';
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

/** Prefer a fresh Supabase session token (auto-refreshed by supabase-js). */
async function resolveAccessToken(fallbackToken?: string): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const fresh = data.session?.access_token?.trim();
  if (fresh) return fresh;
  return fallbackToken?.trim() ?? '';
}

function throwTtsHttpError(res: Response, json: ErrorBody | undefined, raw: string): never {
  const code = typeof json?.code === 'string' ? json.code : undefined;

  if (code === 'tts_provider_auth') {
    throw new Error('Voice key is not configured correctly.');
  }

  if (code === 'tts_provider_quota') {
    throw new Error('Voice playback needs ElevenLabs credits or a paid plan.');
  }

  if (res.status === 401 || res.status === 403) {
    throw new Error('Please sign in again.');
  }

  if (code === 'tts_provider_error' || code === 'tts_error' || code === 'tts_rate_limited') {
    throw new Error('Could not play voice right now.');
  }

  const serverMsg = typeof json?.error === 'string' ? json.error : undefined;
  if (serverMsg?.includes('Voice key is not configured correctly')) {
    throw new Error('Voice key is not configured correctly.');
  }
  if (serverMsg) {
    throw new Error('Could not play voice right now.');
  }

  const gatewayMsg = typeof json?.message === 'string' ? json.message : undefined;
  if (gatewayMsg && (res.status === 401 || res.status === 403)) {
    throw new Error('Please sign in again.');
  }

  throw new Error('Could not play voice right now.');
}

/** GET elevenlabs-tts?health=1 — safe TTS status (no full keys). */
export async function fetchTtsHealth(authToken?: string): Promise<TtsHealthStatus | null> {
  if (!env.elevenLabsTtsUrl) return null;

  const url = `${env.elevenLabsTtsUrl}${env.elevenLabsTtsUrl.includes('?') ? '&' : '?'}health=1`;
  const headers: Record<string, string> = {};
  if (authToken?.trim()) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  if (env.supabaseAnonKey) {
    headers.apikey = env.supabaseAnonKey;
  }

  try {
    const res = await fetch(url, { method: 'GET', headers });
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
    throwTtsHttpError(res, json, raw);
  }

  const body = json as Record<string, unknown> | undefined;
  const audioBase64 = body?.audioBase64;
  const contentType = body?.contentType;
  if (typeof audioBase64 !== 'string' || !audioBase64) {
    throw new Error('Voice response missing audio.');
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
