/**
 * Voxa — ElevenLabs TTS proxy. API key stays server-side only.
 *
 * Secrets:
 *   ELEVENLABS_API_KEY — required (ElevenLabs API key, usually starts with sk_)
 *   ELEVENLABS_MODEL   — optional (default eleven_multilingual_v2)
 *   ELEVENLABS_DEFAULT_VOICE_ID — optional (default Rachel premade voice)
 *
 * GET ?health=1 — safe status (no keys exposed)
 * POST { "text": "Voice test" } — minimal test (scenarioId/learningPath optional)
 */

const MAX_TEXT_CHARS = 500;
/** Lower cost; works on free-tier API access. */
const DEFAULT_MODEL = "eleven_flash_v2_5";
/** Sarah — premade voice available on free-tier API (Rachel requires paid plan). */
const DEFAULT_VOICE_ID = "EXAVITQu4vr4xnSDxMaL";
const ELEVENLABS_TTS_BASE = "https://api.elevenlabs.io/v1/text-to-speech";

const LEARNING_PATHS = new Set(["business_english", "spanish", "mandarin"]);

type LearningPath = "business_english" | "spanish" | "mandarin";

type TtsRequest = {
  text: string;
  voiceId?: string;
  scenarioId: string;
  learningPath: LearningPath;
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

function safeKeyPrefix(key: string): string {
  const trimmed = key.trim();
  if (!trimmed) return "(empty)";
  if (trimmed.startsWith("sk_")) return "sk_***";
  if (trimmed.length <= 4) return "***";
  return `${trimmed.slice(0, 3)}***`;
}

function getApiKey(): string | null {
  const key = Deno.env.get("ELEVENLABS_API_KEY")?.trim();
  return key || null;
}

function parseBody(raw: string): TtsRequest {
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
  const text = o.text;
  const scenarioId = o.scenarioId;
  const learningPath = o.learningPath;
  const voiceId = o.voiceId;

  if (typeof text !== "string" || !text.trim()) {
    throw new ValidationError("`text` must be a non-empty string");
  }
  if (text.length > MAX_TEXT_CHARS) {
    throw new ValidationError(`Text exceeds ${MAX_TEXT_CHARS} character limit`);
  }

  const resolvedScenarioId =
    typeof scenarioId === "string" && scenarioId.trim()
      ? scenarioId.trim()
      : "voice_test";

  const resolvedLearningPath =
    typeof learningPath === "string" && LEARNING_PATHS.has(learningPath)
      ? (learningPath as LearningPath)
      : "business_english";

  if (
    learningPath !== undefined &&
    (typeof learningPath !== "string" || !LEARNING_PATHS.has(learningPath))
  ) {
    throw new ValidationError(
      "`learningPath` must be one of: business_english | spanish | mandarin",
    );
  }

  if (voiceId !== undefined && (typeof voiceId !== "string" || !voiceId.trim())) {
    throw new ValidationError("`voiceId` must be a non-empty string when provided");
  }

  return {
    text: text.trim(),
    voiceId: typeof voiceId === "string" ? voiceId.trim() : undefined,
    scenarioId: resolvedScenarioId,
    learningPath: resolvedLearningPath,
  };
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

type ProviderErrorInfo = {
  status: number;
  errorCode?: string;
  providerCode?: string;
};

async function readProviderError(res: Response): Promise<ProviderErrorInfo> {
  const status = res.status;
  try {
    const raw = await res.text();
    const json = JSON.parse(raw) as Record<string, unknown>;
    const detail = json.detail;
    if (typeof detail === "object" && detail !== null && !Array.isArray(detail)) {
      const d = detail as Record<string, unknown>;
      const providerCode =
        typeof d.code === "string"
          ? d.code.slice(0, 80)
          : typeof d.status === "string"
            ? d.status.slice(0, 80)
            : undefined;
      if (typeof d.message === "string") {
        return { status, errorCode: d.message.slice(0, 120), providerCode };
      }
      if (providerCode) {
        return { status, errorCode: providerCode, providerCode };
      }
    }
    if (typeof detail === "string") {
      return { status, errorCode: detail.slice(0, 80) };
    }
    if (typeof json.message === "string") {
      return { status, errorCode: json.message.slice(0, 80) };
    }
  } catch {
    /* ignore parse errors */
  }
  return { status };
}

async function callElevenLabsTts(
  apiKey: string,
  voiceId: string,
  model: string,
  text: string,
): Promise<Response> {
  const url = `${ELEVENLABS_TTS_BASE}/${encodeURIComponent(voiceId)}`;
  return fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: model,
    }),
  });
}

function healthResponse(apiKey: string | null): Response {
  return jsonResponse({
    configured: Boolean(apiKey),
    hasKey: Boolean(apiKey),
    mode: "tts",
    keyPrefix: apiKey ? safeKeyPrefix(apiKey) : null,
    defaultVoiceId: DEFAULT_VOICE_ID,
    defaultModel: DEFAULT_MODEL,
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const apiKey = getApiKey();

  if (req.method === "GET") {
    const url = new URL(req.url);
    if (url.searchParams.get("health") === "1" || url.pathname.endsWith("/health")) {
      return healthResponse(apiKey);
    }
    return errorResponse("Use POST for TTS or GET ?health=1", 405, "method_not_allowed");
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405, "method_not_allowed");
  }

  if (!apiKey) {
    console.error(JSON.stringify({
      event: "elevenlabs_tts_misconfigured",
      hasKey: false,
    }));
    return errorResponse("Server misconfiguration", 500, "server_misconfigured");
  }

  let body: TtsRequest;
  try {
    body = parseBody(await req.text());
  } catch (e) {
    if (e instanceof ValidationError) {
      return errorResponse(e.message, 400, "invalid_payload");
    }
    return errorResponse("Could not read request body", 400, "invalid_body");
  }

  const voiceId =
    body.voiceId ||
    Deno.env.get("ELEVENLABS_DEFAULT_VOICE_ID")?.trim() ||
    DEFAULT_VOICE_ID;
  const model = Deno.env.get("ELEVENLABS_MODEL")?.trim() || DEFAULT_MODEL;

  console.log(JSON.stringify({
    event: "elevenlabs_tts_request",
    hasKey: true,
    keyPrefix: safeKeyPrefix(apiKey),
    voiceId,
    model,
    scenarioId: body.scenarioId,
    learningPath: body.learningPath,
    textLength: body.text.length,
  }));

  try {
    const res = await callElevenLabsTts(apiKey, voiceId, model, body.text);

    if (!res.ok) {
      const providerErr = await readProviderError(res);
      console.error(JSON.stringify({
        event: "elevenlabs_tts_provider_error",
        hasKey: true,
        keyPrefix: safeKeyPrefix(apiKey),
        providerStatus: providerErr.status,
        providerErrorCode: providerErr.errorCode ?? null,
        voiceId,
        model,
      }));

      if (providerErr.status === 401 || providerErr.status === 403) {
        return errorResponse(
          "Voice key is not configured correctly.",
          502,
          "tts_provider_auth",
        );
      }

      if (
        providerErr.status === 402 ||
        providerErr.providerCode === "paid_plan_required" ||
        providerErr.providerCode === "payment_required"
      ) {
        return errorResponse(
          "Voice playback needs ElevenLabs credits or a paid plan for this voice.",
          402,
          "tts_provider_quota",
        );
      }

      if (providerErr.status === 429) {
        return errorResponse(
          "Voice playback is temporarily rate-limited. Try again shortly.",
          429,
          "tts_rate_limited",
        );
      }

      return errorResponse(
        "Voice playback is temporarily unavailable.",
        502,
        "tts_provider_error",
      );
    }

    const buffer = await res.arrayBuffer();
    const audioBase64 = bytesToBase64(new Uint8Array(buffer));

    console.log(JSON.stringify({
      event: "elevenlabs_tts_success",
      providerStatus: 200,
      audioBytes: buffer.byteLength,
      voiceId,
      model,
    }));

    return jsonResponse({
      audioBase64,
      contentType: "audio/mpeg",
      characterCount: body.text.length,
      voiceId,
      model,
      truncated: false,
    });
  } catch (e) {
    console.error(JSON.stringify({
      event: "elevenlabs_tts_error",
      hasKey: true,
      keyPrefix: safeKeyPrefix(apiKey),
      errorName: e instanceof Error ? e.name : "unknown",
    }));
    return errorResponse("Voice playback failed.", 502, "tts_error");
  }
});
