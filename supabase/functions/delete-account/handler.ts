/**
 * Voxa — account deletion request handler (runtime-agnostic, no Deno/npm imports).
 *
 * Kept free of runtime-specific imports so it can be unit tested under Node
 * (`npm test`) and type-checked under Deno (`deno check`). `index.ts` wires the
 * real Supabase admin client into these dependencies.
 */

/**
 * User-owned tables, deleted child-first. Most rows also cascade from
 * `auth.users → profiles`, but deleting explicitly keeps deletion complete even
 * if a production table was created without the cascading foreign key.
 */
export const USER_OWNED_TABLES: ReadonlyArray<{ table: string; userColumn: string }> = [
  { table: "corrections", userColumn: "user_id" },
  { table: "conversation_messages", userColumn: "user_id" },
  { table: "streak_events", userColumn: "user_id" },
  { table: "conversations", userColumn: "user_id" },
  { table: "user_progress", userColumn: "user_id" },
  { table: "ai_coach_usage", userColumn: "user_id" },
  { table: "realtime_session_usage", userColumn: "user_id" },
  { table: "profiles", userColumn: "id" },
];

export type DbError = { code?: string; message?: string } | null;

export type DeleteAccountDeps = {
  /** Returns the auth user id for a valid access token, or null if invalid/expired. */
  getUserIdFromToken: (token: string) => Promise<string | null>;
  /** Deletes rows in `table` where `column = userId`. Returns the PostgREST error, if any. */
  deleteRows: (table: string, column: string, userId: string) => Promise<DbError>;
  /** Hard-deletes the auth user. Returns an error message, or null on success. */
  deleteAuthUser: (userId: string) => Promise<string | null>;
  log?: (entry: Record<string, unknown>) => void;
};

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-skip-browser-warning",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function errorResponse(message: string, status: number, code: string): Response {
  return jsonResponse({ error: message, code }, status);
}

export function getBearerToken(req: Request): string | null {
  const raw = req.headers.get("Authorization")?.trim();
  if (!raw?.toLowerCase().startsWith("bearer ")) return null;
  return raw.slice(7).trim() || null;
}

/** A table that does not exist in this project is not an error for deletion purposes. */
export function isMissingTableError(error: DbError): boolean {
  if (!error) return false;
  // 42P01 = Postgres undefined_table; PGRST205 = PostgREST "could not find the table".
  if (error.code === "42P01" || error.code === "PGRST205") return true;
  return /does not exist|could not find the table/i.test(error.message ?? "");
}

const GENERIC_FAILURE = "We could not delete your account. Please try again.";

export function createDeleteAccountHandler(deps: DeleteAccountDeps) {
  const log = deps.log ?? (() => {});

  return async function handle(req: Request): Promise<Response> {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "POST") return errorResponse("Method not allowed", 405, "method_not_allowed");

    const token = getBearerToken(req);
    if (!token) return errorResponse("Sign in required.", 401, "unauthorized");

    let userId: string | null;
    try {
      userId = await deps.getUserIdFromToken(token);
    } catch {
      userId = null;
    }
    if (!userId) {
      return errorResponse("Your session has expired. Sign in again to delete your account.", 401, "unauthorized");
    }

    let confirmation: unknown;
    try {
      const parsed = JSON.parse(await req.text()) as Record<string, unknown> | null;
      confirmation = parsed && typeof parsed === "object" ? parsed.confirmation : undefined;
    } catch {
      confirmation = undefined;
    }
    if (confirmation !== "DELETE") {
      return errorResponse("Account deletion must be confirmed.", 400, "confirmation_required");
    }

    // Delete user-owned rows first: if anything fails, the auth user still exists
    // and the person can retry with the same session.
    for (const { table, userColumn } of USER_OWNED_TABLES) {
      const error = await deps.deleteRows(table, userColumn, userId);
      if (error && !isMissingTableError(error)) {
        log({ event: "delete_account_rows_failed", table, code: error.code ?? null });
        return errorResponse(GENERIC_FAILURE, 500, "delete_rows_failed");
      }
    }

    const authError = await deps.deleteAuthUser(userId);
    if (authError) {
      log({ event: "delete_account_auth_failed" });
      return errorResponse(GENERIC_FAILURE, 500, "delete_auth_failed");
    }

    log({ event: "delete_account_success" });
    return jsonResponse({ deleted: true });
  };
}
