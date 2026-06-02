/**
 * Voxa — Permanently delete the signed-in user's account and associated data.
 *
 * Secrets (auto-injected by Supabase):
 *   SUPABASE_URL
 *   SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * POST (Authorization: Bearer <user JWT>) — no body required.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-skip-browser-warning",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status: number, code?: string): Response {
  return jsonResponse(code ? { error: message, code } : { error: message }, status);
}

function getBearerToken(req: Request): string | null {
  const auth = req.headers.get("Authorization")?.trim();
  if (!auth?.toLowerCase().startsWith("bearer ")) return null;
  const token = auth.slice(7).trim();
  return token || null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405, "method_not_allowed");
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")?.trim();
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error(JSON.stringify({ event: "delete_account_misconfigured" }));
    return errorResponse("Server misconfiguration", 500, "server_misconfigured");
  }

  const token = getBearerToken(req);
  if (!token) {
    return errorResponse("Sign in required", 401, "unauthorized");
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) {
    return errorResponse("Invalid or expired session", 401, "unauthorized");
  }

  const userId = userData.user.id;

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    // Explicit cleanup for tables not cascaded from profiles (tts_usage cascades from auth.users).
    await admin.from("tts_usage").delete().eq("user_id", userId);

    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error(JSON.stringify({
        event: "delete_account_auth_failed",
        userId,
        message: deleteError.message,
      }));
      return errorResponse("Could not delete account. Try again or contact support.", 502, "delete_failed");
    }

    console.log(JSON.stringify({ event: "delete_account_success", userId }));

    return jsonResponse({ ok: true });
  } catch (e) {
    console.error(JSON.stringify({
      event: "delete_account_error",
      userId,
      errorName: e instanceof Error ? e.name : "unknown",
    }));
    return errorResponse("Could not delete account. Try again later.", 502, "delete_failed");
  }
});
