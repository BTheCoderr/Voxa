/**
 * Per-user daily TTS quota decision (runtime-agnostic so it can be unit tested in Node).
 * Backed by `public.consume_tts_quota` (migration 20261126114022).
 */

export const DEFAULT_TTS_DAILY_REQUEST_LIMIT = 60;
export const DEFAULT_TTS_DAILY_CHAR_LIMIT = 15_000;

export type QuotaRpc = (args: {
  p_user_id: string;
  p_usage_date: string;
  p_chars: number;
  p_max_requests: number;
  p_max_chars: number;
}) => Promise<{ data: unknown; error: { code?: string; message?: string } | null }>;

/**
 * - allowed: request reserved
 * - limited: would exceed today's request or character cap
 * - unmigrated: quota RPC not deployed yet (allowed, but logged, so deploy order is forgiving)
 * - unavailable: quota storage error (fail closed)
 */
export type TtsQuotaDecision = "allowed" | "limited" | "unmigrated" | "unavailable";

export function isMissingFunctionError(error: { code?: string; message?: string }): boolean {
  return error.code === "PGRST202" || error.code === "42883" ||
    /could not find the function/i.test(error.message ?? "");
}

export async function consumeTtsQuota(
  rpc: QuotaRpc,
  input: { userId: string; usageDate: string; chars: number; maxRequests: number; maxChars: number },
): Promise<TtsQuotaDecision> {
  let result: Awaited<ReturnType<QuotaRpc>>;
  try {
    result = await rpc({
      p_user_id: input.userId,
      p_usage_date: input.usageDate,
      p_chars: input.chars,
      p_max_requests: input.maxRequests,
      p_max_chars: input.maxChars,
    });
  } catch {
    return "unavailable";
  }
  if (result.error) return isMissingFunctionError(result.error) ? "unmigrated" : "unavailable";
  if (result.data === true) return "allowed";
  if (result.data === false) return "limited";
  return "unavailable";
}
