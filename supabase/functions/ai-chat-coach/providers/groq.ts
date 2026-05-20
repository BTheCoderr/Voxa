import type { ChatCoachResponse, CoachProviderParams } from "./types.ts";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

function parseCoachJson(raw: string): ChatCoachResponse {
  const trimmed = raw.trim();
  const jsonBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const text = jsonBlock ? jsonBlock[1]!.trim() : trimmed;
  const parsed = JSON.parse(text) as Record<string, unknown>;

  const reply = typeof parsed.reply === "string" ? parsed.reply : "";
  const encouragement = typeof parsed.encouragement === "string" ? parsed.encouragement : "";
  const correctionsRaw = Array.isArray(parsed.corrections) ? parsed.corrections : [];

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

  return { reply, corrections, encouragement: encouragement || "Nice effort — keep going." };
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
      max_tokens: 1024,
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
