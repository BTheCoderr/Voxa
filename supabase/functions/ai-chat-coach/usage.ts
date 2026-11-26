import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

export const AI_DAILY_LIMIT_MESSAGE =
  "You've reached today's free practice limit. Come back tomorrow to keep practicing.";

export function envInt(name: string, fallback: number): number {
  const raw = Deno.env.get(name)?.trim();
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getBearerToken(req: Request): string | null {
  const auth = req.headers.get("Authorization")?.trim();
  if (!auth?.toLowerCase().startsWith("bearer ")) return null;
  const token = auth.slice(7).trim();
  return token || null;
}

export async function resolveUserId(req: Request): Promise<string | null> {
  const token = getBearerToken(req);
  if (!token) return null;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")?.trim();
  if (!supabaseUrl || !anonKey) return null;

  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  return data.user.id;
}

export function getServiceAdmin(): SupabaseClient | null {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function getDailyMessageCount(userId: string): Promise<number | null> {
  const admin = getServiceAdmin();
  if (!admin) return null;

  const { data: row, error } = await admin
    .from("ai_coach_usage")
    .select("message_count")
    .eq("user_id", userId)
    .eq("usage_date", utcToday())
    .maybeSingle();

  if (error) {
    console.error(JSON.stringify({ event: "ai_coach_quota_select_error", message: error.message }));
    return null;
  }

  return row?.message_count ?? 0;
}

/** PostgREST / Postgres codes meaning the increment RPC has not been migrated yet. */
function isMissingFunctionError(error: { code?: string; message?: string }): boolean {
  return error.code === "PGRST202" || error.code === "42883" ||
    /could not find the function/i.test(error.message ?? "");
}

export async function incrementDailyMessageCount(userId: string): Promise<void> {
  const admin = getServiceAdmin();
  if (!admin) return;

  const usageDate = utcToday();

  // Atomic increment (migration 20261126114022). Concurrent requests can no longer
  // overwrite each other's count, which previously let a fast client exceed the quota.
  const { error: rpcError } = await admin.rpc("increment_ai_coach_usage", {
    p_user_id: userId,
    p_usage_date: usageDate,
  });
  if (!rpcError) return;
  if (!isMissingFunctionError(rpcError)) {
    console.error(JSON.stringify({ event: "ai_coach_quota_rpc_error", code: rpcError.code ?? null }));
    return;
  }

  // Legacy read-then-write path for projects where the migration is not applied yet.
  const current = await getDailyMessageCount(userId);
  if (current === null) return;

  if (current > 0) {
    const { error } = await admin
      .from("ai_coach_usage")
      .update({ message_count: current + 1 })
      .eq("user_id", userId)
      .eq("usage_date", usageDate);
    if (error) {
      console.error(JSON.stringify({ event: "ai_coach_quota_update_error", message: error.message }));
    }
    return;
  }

  const { error } = await admin.from("ai_coach_usage").insert({
    user_id: userId,
    usage_date: usageDate,
    message_count: 1,
  });
  if (error) {
    console.error(JSON.stringify({ event: "ai_coach_quota_insert_error", message: error.message }));
  }
}

function isMissingColumnError(error: { code?: string; message?: string }): boolean {
  return error.code === "42703" || error.code === "PGRST204" ||
    /column .* does not exist/i.test(error.message ?? "");
}

/**
 * Sessions started today from the server-side counter (migration 20261126114022).
 * Returns "unsupported" when the column is not migrated yet, null on other errors.
 */
export async function getSessionsStartedToday(
  userId: string,
): Promise<number | null | "unsupported"> {
  const admin = getServiceAdmin();
  if (!admin) return null;

  const { data: row, error } = await admin
    .from("ai_coach_usage")
    .select("session_count")
    .eq("user_id", userId)
    .eq("usage_date", utcToday())
    .maybeSingle();

  if (error) {
    if (isMissingColumnError(error)) return "unsupported";
    console.error(JSON.stringify({ event: "ai_coach_session_select_error", code: error.code ?? null }));
    return null;
  }
  return (row as { session_count?: number } | null)?.session_count ?? 0;
}

export async function incrementDailySessionCount(userId: string): Promise<void> {
  const admin = getServiceAdmin();
  if (!admin) return;
  const { error } = await admin.rpc("increment_ai_coach_session", {
    p_user_id: userId,
    p_usage_date: utcToday(),
  });
  if (error && !isMissingFunctionError(error)) {
    console.error(JSON.stringify({ event: "ai_coach_session_rpc_error", code: error.code ?? null }));
  }
}

/** Legacy session count (completed conversations); used only before the migration. */
export async function getCompletedSessionsToday(userId: string): Promise<number | null> {
  const admin = getServiceAdmin();
  if (!admin) return null;

  const dayStart = `${utcToday()}T00:00:00.000Z`;
  const dayEnd = `${utcToday()}T23:59:59.999Z`;

  const { count, error } = await admin
    .from("conversations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "completed")
    .gte("ended_at", dayStart)
    .lte("ended_at", dayEnd);

  if (error) {
    console.error(JSON.stringify({ event: "ai_coach_session_count_error", message: error.message }));
    return null;
  }

  return count ?? 0;
}

export function countUserMessages(messages: { role: string }[]): number {
  return messages.filter((m) => m.role === "user").length;
}

export function isNewSessionStart(messages: { role: string }[]): boolean {
  return countUserMessages(messages) === 1;
}
