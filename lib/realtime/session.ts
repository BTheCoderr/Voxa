import { env } from '@/lib/env';
import type { ApiLearningPath } from '@/lib/realtime/learningPath';
import {
  RealtimeConfigurationError,
  type RealtimeSessionMintResponse,
  type UserLevel,
} from '@/lib/realtime/types';

export type CreateRealtimeSessionInput = {
  scenarioId: string;
  learningPath: ApiLearningPath;
  userLevel: UserLevel;
  /** Supabase user access_token; required when Edge Function uses `verify_jwt`. */
  authToken: string;
};

type ErrorResponseBody = {
  error?: string;
  code?: string;
};

/**
 * Calls the Voxa `realtime-session` Edge Function to mint an OpenAI Realtime client secret.
 * Never put OPENAI_API_KEY in the app — only this backend uses it.
 */
export async function fetchRealtimeClientSecret(
  input: CreateRealtimeSessionInput,
): Promise<RealtimeSessionMintResponse> {
  if (!env.realtimeSessionUrl) {
    throw new RealtimeConfigurationError(
      'Missing EXPO_PUBLIC_REALTIME_SESSION_URL. Point it at your deployed realtime-session function.',
    );
  }

  if (!input.authToken?.trim()) {
    throw new RealtimeConfigurationError(
      'Sign in is required to start a voice session. Your project’s Edge Function uses JWT verification.',
    );
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${input.authToken}`,
  };

  if (env.supabaseAnonKey) {
    headers.apikey = env.supabaseAnonKey;
  }

  const res = await fetch(env.realtimeSessionUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      scenarioId: input.scenarioId,
      learningPath: input.learningPath,
      userLevel: input.userLevel,
    }),
  });

  const raw = await res.text();
  let json: Record<string, unknown> | undefined;
  try {
    json = raw ? (JSON.parse(raw) as Record<string, unknown>) : undefined;
  } catch {
    json = undefined;
  }

  if (!res.ok) {
    const err = json as ErrorResponseBody | undefined;
    const msg =
      (err && typeof err.error === 'string' && err.error) ||
      (raw ? raw.slice(0, 280) : '') ||
      `Realtime session request failed (${res.status})`;
    throw new Error(msg);
  }

  if (!json) {
    throw new Error('Empty response from realtime-session function.');
  }

  const clientSecret = json.clientSecret;
  const expiresAt = json.expiresAt;
  const sessionId = json.sessionId;
  const model = json.model;

  if (typeof clientSecret !== 'string' || !clientSecret) {
    throw new Error('Response missing `clientSecret`.');
  }
  if (typeof expiresAt !== 'number') {
    throw new Error('Response missing numeric `expiresAt`.');
  }
  if (typeof sessionId !== 'string' || !sessionId) {
    throw new Error('Response missing `sessionId`.');
  }
  if (typeof model !== 'string' || !model) {
    throw new Error('Response missing `model`.');
  }

  return { clientSecret, expiresAt, sessionId, model };
}
