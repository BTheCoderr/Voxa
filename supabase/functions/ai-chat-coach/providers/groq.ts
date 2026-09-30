import type { ChatCoachResponse, CoachProviderParams, CoachSkillTag } from "./types.ts";

const COACH_SKILL_TAGS = new Set<CoachSkillTag>([
  "clarity",
  "grammar",
  "vocabulary",
  "fluency",
  "natural_phrasing",
  "professional_tone",
  "response_building",
  "conversation_flow",
  "conciseness",
  "politeness",
]);

function parseSkillTag(value: unknown, fallback: CoachSkillTag): CoachSkillTag {
  return typeof value === "string" && COACH_SKILL_TAGS.has(value as CoachSkillTag)
    ? (value as CoachSkillTag)
    : fallback;
}

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

function parseCoachJson(raw: string): ChatCoachResponse {
  const trimmed = raw.trim();
  const jsonBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const text = jsonBlock ? jsonBlock[1]!.trim() : trimmed;
  const parsed = JSON.parse(text) as Record<string, unknown>;

  const reply = typeof parsed.reply === "string" ? parsed.reply : "";
  const encouragement = typeof parsed.encouragement === "string" ? parsed.encouragement : "";
  const correctionsRaw = Array.isArray(parsed.corrections) ? parsed.corrections : [];
  const reviewRaw =
    parsed.review && typeof parsed.review === "object" && !Array.isArray(parsed.review)
      ? (parsed.review as Record<string, unknown>)
      : null;

  const corrections = correctionsRaw
    .filter((c): c is Record<string, unknown> => c && typeof c === "object")
    .map((c) => ({
      original: typeof c.original === "string" ? c.original : "",
      improved: typeof c.improved === "string" ? c.improved : "",
      explanation: typeof c.explanation === "string" ? c.explanation : "",
    }))
    .filter((c) => c.original || c.improved);

  if (!reply) {
    throw new Error("Groq response missing reply");
  }

  const review =
    reviewRaw &&
    typeof reviewRaw.headline === "string" &&
    typeof reviewRaw.strength === "string" &&
    typeof reviewRaw.focus === "string" &&
    typeof reviewRaw.nextMission === "string" &&
    typeof reviewRaw.suggestedScenarioId === "string"
      ? {
          headline: reviewRaw.headline.trim(),
          strength: reviewRaw.strength.trim(),
          strengthTag: parseSkillTag(reviewRaw.strengthTag, "conversation_flow"),
          focus: reviewRaw.focus.trim(),
          focusTag: parseSkillTag(reviewRaw.focusTag, "natural_phrasing"),
          nextMission: reviewRaw.nextMission.trim(),
          suggestedScenarioId: reviewRaw.suggestedScenarioId.trim(),
        }
      : undefined;

  return {
    reply,
    corrections,
    encouragement: encouragement || "Nice effort — keep going.",
    ...(review ? { review } : {}),
  };
}

export async function callGroqCoach(
  params: CoachProviderParams,
  apiKey: string,
  model = "llama-3.1-8b-instant",
): Promise<ChatCoachResponse> {
  const messages = [
    { role: "system" as const, content: params.systemPrompt },
    ...params.messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.75,
      max_tokens: params.maxOutputTokens,
      response_format: { type: "json_object" },
    }),
  });

  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`Groq error ${res.status}: ${raw.slice(0, 240)}`);
  }

  const data = JSON.parse(raw) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("Groq returned empty content");
  }

  return parseCoachJson(text);
}
