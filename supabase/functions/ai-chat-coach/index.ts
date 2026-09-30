/**
 * Voxa — Text AI coach (Groq primary, Gemini fallback). Keys are server-side only.
 *
 * Secrets (Supabase Dashboard → Edge Functions → Secrets):
 *   VOXA_AI_PROVIDER  — "groq" (default) | "gemini"
 *   GROQ_API_KEY        — primary when provider is groq (default)
 *   GEMINI_API_KEY      — fallback when groq fails; primary when provider is gemini
 *   GROQ_MODEL          — optional (default llama-3.1-8b-instant)
 *   GEMINI_MODEL        — optional (default gemini-2.0-flash-lite)
 *   AI_DAILY_MESSAGE_LIMIT — optional (default 20)
 *   AI_DAILY_SESSION_LIMIT — optional (default 5)
 *   AI_MAX_INPUT_CHARS     — optional (default 1500)
 *   AI_MAX_OUTPUT_TOKENS   — optional (default 1024)
 *
 * POST requires a signed-in user JWT. Daily quotas enforced server-side.
 */

import { buildCoachSystemPrompt } from "./prompts.ts";
import { callGeminiCoach } from "./providers/gemini.ts";
import { callGroqCoach } from "./providers/groq.ts";
import type { ChatCoachResponse } from "./providers/types.ts";
import {
  AI_DAILY_LIMIT_MESSAGE,
  envInt,
  getCompletedSessionsToday,
  getDailyMessageCount,
  incrementDailyMessageCount,
  isNewSessionStart,
  resolveUserId,
} from "./usage.ts";

const LEARNING_PATHS = new Set(["business_english", "spanish", "mandarin"]);
const USER_LEVELS = new Set(["beginner", "intermediate", "advanced"]);
const COACH_TIMEOUT_MS = 25_000;
const DEFAULT_AI_DAILY_MESSAGE_LIMIT = 20;
const DEFAULT_AI_DAILY_SESSION_LIMIT = 5;
const DEFAULT_AI_MAX_INPUT_CHARS = 1500;
const DEFAULT_AI_MAX_OUTPUT_TOKENS = 1024;
const MAX_SESSION_GOAL_CHARS = 400;

type LearningPath = "business_english" | "spanish" | "mandarin";
type UserLevel = "beginner" | "intermediate" | "advanced";
type ProviderName = "gemini" | "groq";
type CoachMode = "practice" | "review";

type ChatMessage = { role: "user" | "assistant"; content: string };

type CoachRequest = {
  scenarioId: string;
  learningPath: LearningPath;
  userLevel: UserLevel;
  mode: CoachMode;
  sessionGoal?: string;
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

function parseBody(raw: string, maxInputChars: number): CoachRequest {
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
  const mode = o.mode;
  const sessionGoal = o.sessionGoal;
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
  if (mode !== undefined && mode !== "practice" && mode !== "review") {
    throw new ValidationError("`mode` must be practice or review");
  }
  if (
    sessionGoal !== undefined &&
    (typeof sessionGoal !== "string" || sessionGoal.trim().length > MAX_SESSION_GOAL_CHARS)
  ) {
    throw new ValidationError(`sessionGoal must be a string up to ${MAX_SESSION_GOAL_CHARS} characters`);
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
    if (msg.content.length > maxInputChars) {
      throw new ValidationError(`Message exceeds ${maxInputChars} characters`);
    }
    normalized.push({ role: msg.role, content: msg.content.trim() });
  }

  return {
    scenarioId: scenarioId.trim(),
    learningPath: learningPath as LearningPath,
    userLevel: userLevel as UserLevel,
    mode: (mode === "review" ? "review" : "practice") as CoachMode,
    ...(typeof sessionGoal === "string" && sessionGoal.trim()
      ? { sessionGoal: sessionGoal.trim() }
      : {}),
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
  maxOutputTokens: number,
): Promise<ChatCoachResponse> {
  const params = { ...body, systemPrompt, maxOutputTokens };

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
  maxOutputTokens: number,
): Promise<{ result: ChatCoachResponse; providerUsed: ProviderName; usedFallback: boolean }> {
  const primary = resolvePrimaryProvider();
  const fallback = resolveFallbackProvider(primary);

  if (!providerConfigured(primary)) {
    if (providerConfigured(fallback)) {
      console.warn(`Primary provider ${primary} not configured; using ${fallback}`);
      const result = await withTimeout(
        callProvider(fallback, body, systemPrompt, maxOutputTokens),
        COACH_TIMEOUT_MS,
      );
      return { result, providerUsed: fallback, usedFallback: true };
    }
    throw new Error(`Server misconfiguration: no AI provider keys set`);
  }

  try {
    const result = await withTimeout(
      callProvider(primary, body, systemPrompt, maxOutputTokens),
      COACH_TIMEOUT_MS,
    );
    return { result, providerUsed: primary, usedFallback: false };
  } catch (primaryError) {
    if (!providerConfigured(fallback) || !shouldFallbackToSecondary(primaryError)) {
      throw primaryError;
    }
    console.warn(
      `Primary provider ${primary} failed; falling back to ${fallback}:`,
      primaryError instanceof Error ? primaryError.message : primaryError,
    );
    const result = await withTimeout(
      callProvider(fallback, body, systemPrompt, maxOutputTokens),
      COACH_TIMEOUT_MS,
    );
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

  const userId = await resolveUserId(req);
  if (!userId) {
    return errorResponse("Sign in required to practice.", 401, "unauthorized");
  }

  const dailyMessageLimit = envInt("AI_DAILY_MESSAGE_LIMIT", DEFAULT_AI_DAILY_MESSAGE_LIMIT);
  const dailySessionLimit = envInt("AI_DAILY_SESSION_LIMIT", DEFAULT_AI_DAILY_SESSION_LIMIT);
  const maxInputChars = envInt("AI_MAX_INPUT_CHARS", DEFAULT_AI_MAX_INPUT_CHARS);
  const maxOutputTokens = envInt("AI_MAX_OUTPUT_TOKENS", DEFAULT_AI_MAX_OUTPUT_TOKENS);

  let body: CoachRequest;
  try {
    body = parseBody(await req.text(), maxInputChars);
  } catch (e) {
    if (e instanceof ValidationError) {
      return errorResponse(e.message, 400, "invalid_payload");
    }
    return errorResponse("Could not read request body", 400, "invalid_body");
  }

  const messageCount = await getDailyMessageCount(userId);
  if (messageCount === null) {
    return errorResponse(
      "The AI coach is temporarily unavailable. Try again in a moment.",
      503,
      "usage_quota_error",
    );
  }
  if (messageCount >= dailyMessageLimit) {
    console.log(JSON.stringify({
      event: "ai_coach_daily_message_limit",
      userId,
      messageCount,
      dailyMessageLimit,
      scenarioId: body.scenarioId,
    }));
    return errorResponse(AI_DAILY_LIMIT_MESSAGE, 429, "ai_daily_limit");
  }

  if (body.mode === "practice" && isNewSessionStart(body.messages)) {
    const completedSessions = await getCompletedSessionsToday(userId);
    if (completedSessions === null) {
      return errorResponse(
        "The AI coach is temporarily unavailable. Try again in a moment.",
        503,
        "usage_quota_error",
      );
    }
    if (completedSessions >= dailySessionLimit) {
      console.log(JSON.stringify({
        event: "ai_coach_daily_session_limit",
        userId,
        completedSessions,
        dailySessionLimit,
        scenarioId: body.scenarioId,
      }));
      return errorResponse(AI_DAILY_LIMIT_MESSAGE, 429, "ai_daily_limit");
    }
  }

  const lastUserMessage = [...body.messages].reverse().find((m) => m.role === "user");
  console.log(JSON.stringify({
    event: "ai_coach_request",
    userId,
    scenarioId: body.scenarioId,
    learningPath: body.learningPath,
    mode: body.mode,
    messageCountToday: messageCount,
    userMessagesInPayload: body.messages.filter((m) => m.role === "user").length,
    inputChars: lastUserMessage?.content.length ?? 0,
    hasSessionGoal: Boolean(body.sessionGoal),
    sessionGoalChars: body.sessionGoal?.length ?? 0,
  }));

  const systemPrompt = buildCoachSystemPrompt(
    body.scenarioId,
    body.learningPath,
    body.userLevel,
    body.mode,
    body.sessionGoal,
  );

  try {
    const { result, providerUsed, usedFallback } = await runCoachWithFallback(
      body,
      systemPrompt,
      maxOutputTokens,
    );
    await incrementDailyMessageCount(userId);
    console.log(JSON.stringify({
      event: "ai_coach_success",
      userId,
      scenarioId: body.scenarioId,
      mode: body.mode,
      providerUsed,
      usedFallback,
      messageCountAfter: messageCount + 1,
      replyLength: result.reply.length,
    }));
    return jsonResponse({
      ...result,
      _meta: { providerUsed, usedFallback },
    });
  } catch (e) {
    console.error(JSON.stringify({
      event: "ai_coach_provider_error",
      userId,
      scenarioId: body.scenarioId,
      message: e instanceof Error ? e.message : String(e),
    }));
    return errorResponse(
      "The AI coach is temporarily unavailable. Try again in a moment.",
      502,
      "provider_error",
    );
  }
});
