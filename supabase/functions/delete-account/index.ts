/**
 * Voxa — permanently delete the signed-in user's account and server-stored data.
 *
 * POST { "confirmation": "DELETE" } with the user's access token as Bearer.
 * Uses the auto-provided SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY
 * secrets; no additional secrets are required. The service role never leaves the server.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

import { corsHeaders, createDeleteAccountHandler } from "./handler.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim() ?? "";
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")?.trim() ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim() ?? "";

const handler = createDeleteAccountHandler({
  getUserIdFromToken: async (token) => {
    const client = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client.auth.getUser();
    return error || !data.user ? null : data.user.id;
  },
  deleteRows: async (table, column, userId) => {
    const { error } = await admin().from(table).delete().eq(column, userId);
    return error ? { code: error.code, message: error.message } : null;
  },
  deleteAuthUser: async (userId) => {
    const { error } = await admin().auth.admin.deleteUser(userId);
    return error ? error.message : null;
  },
  log: (entry) => console.log(JSON.stringify(entry)),
});

let adminClient: ReturnType<typeof createClient> | null = null;
function admin() {
  adminClient ??= createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return adminClient;
}

Deno.serve((req) => {
  if (req.method !== "OPTIONS" && (!supabaseUrl || !anonKey || !serviceRoleKey)) {
    return new Response(
      JSON.stringify({ error: "Account deletion is temporarily unavailable.", code: "server_misconfigured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  return handler(req);
});
