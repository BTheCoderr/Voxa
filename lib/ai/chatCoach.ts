import { env } from '@/lib/env';
import type { ChatCoachRequest, ChatCoachResponse } from '@/lib/ai/providers/types';

type ErrorBody = { error?: string; code?: string };

/**
 * Calls the `ai-chat-coach` Edge Function (Gemini/Groq keys stay server-side).
 */
export async function fetchChatCoachReply(
  input: ChatCoachRequest,
  authToken: string,
): Promise<ChatCoachResponse> {
  if (!env.aiChatCoachUrl) {
    throw new Error(
      'Missing EXPO_PUBLIC_AI_CHAT_COACH_URL. Deploy ai-chat-coach and set the function URL.',
    );
  }

  if (!authToken?.trim()) {
    throw new Error('Sign in is required to use the AI coach.');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${authToken}`,
  };

  if (env.supabaseAnonKey) {
    headers.apikey = env.supabaseAnonKey;
  }

  const res = await fetch(env.aiChatCoachUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  });

  const raw = await res.text();
  let json: Record<string, unknown> | undefined;
  try {
    json = raw ? (JSON.parse(raw) as Record<string, unknown>) : undefined;
  } catch {
    json = undefined;
  }

  if (!res.ok) {
    const err = json as ErrorBody | undefined;
    const msg =
      (err && typeof err.error === 'string' && err.error) ||
      (raw ? raw.slice(0, 280) : '') ||
      `AI coach request failed (${res.status})`;
    throw new Error(msg);
  }

  if (!json) {
    throw new Error('Empty response from ai-chat-coach function.');
  }

  const reply = json.reply;
  const encouragement = json.encouragement;
  const corrections = json.corrections;

  if (typeof reply !== 'string' || !reply) {
    throw new Error('Response missing `reply`.');
  }

  const parsedCorrections = Array.isArray(corrections)
    ? corrections
        .filter((c): c is Record<string, unknown> => c && typeof c === 'object')
        .map((c) => ({
          original: typeof c.original === 'string' ? c.original : '',
          improved: typeof c.improved === 'string' ? c.improved : '',
          explanation: typeof c.explanation === 'string' ? c.explanation : '',
        }))
        .filter((c) => c.original || c.improved)
    : [];

  return {
    reply,
    corrections: parsedCorrections,
    encouragement: typeof encouragement === 'string' ? encouragement : '',
    providerUsed:
      typeof json._meta === 'object' &&
      json._meta &&
      typeof (json._meta as Record<string, unknown>).providerUsed === 'string'
        ? ((json._meta as Record<string, unknown>).providerUsed as string)
        : undefined,
  };
}
