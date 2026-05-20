/**
 * Voxa — Text AI coach (Groq primary, Gemini fallback). Keys are server-side only.
 *
 * Secrets (Supabase Dashboard → Edge Functions → Secrets):
 *   VOXA_AI_PROVIDER  — "groq" (default) | "gemini"
 *   GROQ_API_KEY        — primary when provider is groq (default)
 *   GEMINI_API_KEY      — fallback when groq fails; primary when provider is gemini
 *   GROQ_MODEL          — optional (default llama-3.1-8b-instant)
 *   GEMINI_MODEL        — optional (default gemini-2.0-flash-lite)
 *
 * GET (health): returns provider status without exposing keys.
 */

import { buildCoachSystemPrompt } from "./prompts.ts";
import { callGeminiCoach } from "./providers/gemini.ts";
import { callGroqCoach } from "./providers/groq.ts";
import type { ChatCoachResponse } from "./providers/types.ts";

const LEARNING_PATHS = new Set(["business_english", "spanish", "mandarin"]);
const USER_LEVELS = new Set(["beginner", "intermediate", "advanced"]);
const COACH_TIMEOUT_MS = 25_000;

type LearningPath = "business_english" | "spanish" | "mandarin";
type UserLevel = "beginner" | "intermediate" | "advanced";
type ProviderName = "gemini" | "groq";

type ChatMessage = { role: "user" | "assistant"; content: string };

type CoachRequest = {
  scenarioId: string;
  learningPath: LearningPath;
  userLevel: UserLevel;
  messages: ChatMessage[];
};

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-skip-browser-warning",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

function parseBody(raw: string): CoachRequest {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ValidationError("Invalid JSON body");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new ValidationError("Body must be a JSON object");
  }

  const o = parsed as Record<string, unknown>;
  const scenarioId = o.scenarioId;
  const learningPath = o.learningPath;
  const userLevel = o.userLevel;
  const messages = o.messages;

  if (typeof scenarioId !== "string" || !scenarioId.trim()) {
    throw new ValidationError("`scenarioId` must be a non-empty string");
  }
  if (typeof learningPath !== "string" || !LEARNING_PATHS.has(learningPath)) {
    throw new ValidationError(
      "`learningPath` must be one of: business_english | spanish | mandarin",
    );
  }
  if (typeof userLevel !== "string" || !USER_LEVELS.has(userLevel)) {
    throw new ValidationError(
      "`userLevel` must be one of: beginner | intermediate | advanced",
    );
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new ValidationError("`messages` must be a non-empty array");
  }

  const normalized: ChatMessage[] = [];
  for (const m of messages) {
    if (!m || typeof m !== "object" || Array.isArray(m)) {
      throw new ValidationError("Each message must be an object");
    }
    const msg = m as Record<string, unknown>;
    if (msg.role !== "user" && msg.role !== "assistant") {
      throw new ValidationError("Message `role` must be user or assistant");
    }
    if (typeof msg.content !== "string" || !msg.content.trim()) {
      throw new ValidationError("Message `content` must be a non-empty string");
    }
    normalized.push({ role: msg.role, content: msg.content.trim() });
  }

  return {
    scenarioId: scenarioId.trim(),
    learningPath: learningPath as LearningPath,
    userLevel: userLevel as UserLevel,
    messages: normalized,
  };
}

function resolvePrimaryProvider(): ProviderName {
  const raw = Deno.env.get("VOXA_AI_PROVIDER")?.trim().toLowerCase();
  if (raw === "gemini") return "gemini";
  return "groq";
}

function resolveFallbackProvider(primary: ProviderName): ProviderName {
  return primary === "gemini" ? "groq" : "gemini";
}

function providerConfigured(name: ProviderName): boolean {
  if (name === "groq") return Boolean(Deno.env.get("GROQ_API_KEY")?.trim());
  return Boolean(Deno.env.get("GEMINI_API_KEY")?.trim());
}

function isRetriableProviderError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  if (/timeout|timed out|abort/i.test(msg)) return true;
  if (/\berror (401|403|429|500|502|503|504)\b/i.test(msg)) return true;
  if (/fetch failed|network|econnreset|enotfound|socket hang up/i.test(msg)) return true;
  if (/invalid api key|invalid_api_key|unauthorized|authentication/i.test(msg)) return true;
  if (/rate.?limit|overloaded|unavailable|resource.?exhausted/i.test(msg)) return true;
  return false;
}

/** Groq primary: also fall back on malformed model output (invalid JSON, missing reply). */
function shouldFallbackToSecondary(e: unknown): boolean {
  if (isRetriableProviderError(e)) return true;
  if (e instanceof SyntaxError) return true;
  const msg = e instanceof Error ? e.message : String(e);
  if (/missing reply|invalid json|unexpected token|empty content|json\.parse|malformed/i.test(msg)) {
    return true;
  }
  return false;
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        controller.signal.addEventListener("abort", () => {
          reject(new Error(`Provider timeout after ${ms}ms`));
        });
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function callProvider(
  name: ProviderName,
  body: CoachRequest,
  systemPrompt: string,
): Promise<ChatCoachResponse> {
  const params = { ...body, systemPrompt };

  if (name === "groq") {
    const key = Deno.env.get("GROQ_API_KEY")?.trim();
    if (!key) throw new Error("Missing GROQ_API_KEY");
    const model = Deno.env.get("GROQ_MODEL")?.trim() || undefined;
    return callGroqCoach(params, key, model);
  }

  const key = Deno.env.get("GEMINI_API_KEY")?.trim();
  if (!key) throw new Error("Missing GEMINI_API_KEY");
  const model = Deno.env.get("GEMINI_MODEL")?.trim() || undefined;
  return callGeminiCoach(params, key, model);
}

async function runCoachWithFallback(
  body: CoachRequest,
  systemPrompt: string,
): Promise<{ result: ChatCoachResponse; providerUsed: ProviderName; usedFallback: boolean }> {
  const primary = resolvePrimaryProvider();
  const fallback = resolveFallbackProvider(primary);

  if (!providerConfigured(primary)) {
    if (providerConfigured(fallback)) {
      console.warn(`Primary provider ${primary} not configured; using ${fallback}`);
      const result = await withTimeout(callProvider(fallback, body, systemPrompt), COACH_TIMEOUT_MS);
      return { result, providerUsed: fallback, usedFallback: true };
    }
    throw new Error(`Server misconfiguration: no AI provider keys set`);
  }

  try {
    const result = await withTimeout(callProvider(primary, body, systemPrompt), COACH_TIMEOUT_MS);
    return { result, providerUsed: primary, usedFallback: false };
  } catch (primaryError) {
    if (!providerConfigured(fallback) || !shouldFallbackToSecondary(primaryError)) {
      throw primaryError;
    }
    console.warn(
      `Primary provider ${primary} failed; falling back to ${fallback}:`,
      primaryError instanceof Error ? primaryError.message : primaryError,
    );
    const result = await withTimeout(callProvider(fallback, body, systemPrompt), COACH_TIMEOUT_MS);
    return { result, providerUsed: fallback, usedFallback: true };
  }
}

function healthResponse(): Response {
  const primary = resolvePrimaryProvider();
  const fallback = resolveFallbackProvider(primary);
  const geminiConfigured = providerConfigured("gemini");
  const groqConfigured = providerConfigured("groq");

  return jsonResponse({
    ok: geminiConfigured || groqConfigured,
    primaryProvider: primary,
    fallbackProvider: fallback,
    fallbackAvailable: providerConfigured(fallback),
    providers: {
      gemini: geminiConfigured ? "configured" : "missing",
      groq: groqConfigured ? "configured" : "missing",
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method === "GET") {
    const url = new URL(req.url);
    if (url.searchParams.get("health") === "1" || url.pathname.endsWith("/health")) {
      return healthResponse();
    }
    return errorResponse("Use POST for chat or GET ?health=1 for status", 405, "method_not_allowed");
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405, "method_not_allowed");
  }

  let body: CoachRequest;
  try {
    body = parseBody(await req.text());
  } catch (e) {
    if (e instanceof ValidationError) {
      return errorResponse(e.message, 400, "invalid_payload");
    }
    return errorResponse("Could not read request body", 400, "invalid_body");
  }

  const systemPrompt = buildCoachSystemPrompt(
    body.scenarioId,
    body.learningPath,
    body.userLevel,
  );

  try {
    const { result, providerUsed, usedFallback } = await runCoachWithFallback(body, systemPrompt);
    return jsonResponse({
      ...result,
      _meta: { providerUsed, usedFallback },
    });
  } catch (e) {
    console.error("Coach provider error:", e);
    return errorResponse(
      "The AI coach is temporarily unavailable. Try again in a moment.",
      502,
      "provider_error",
    );
  }
});
