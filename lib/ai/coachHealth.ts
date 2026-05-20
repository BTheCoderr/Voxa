import { env } from '@/lib/env';

export type CoachHealthStatus = {
  ok: boolean;
  primaryProvider: string;
  fallbackProvider: string;
  fallbackAvailable: boolean;
  providers: {
    gemini: string;
    groq: string;
  };
};

/**
 * GET ai-chat-coach?health=1 — provider status without exposing keys.
 */
export async function fetchCoachHealth(authToken?: string): Promise<CoachHealthStatus | null> {
  if (!env.aiChatCoachUrl) return null;

  const url = `${env.aiChatCoachUrl}${env.aiChatCoachUrl.includes('?') ? '&' : '?'}health=1`;
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
    const json = (await res.json()) as CoachHealthStatus;
    return json;
  } catch {
    return null;
  }
}
