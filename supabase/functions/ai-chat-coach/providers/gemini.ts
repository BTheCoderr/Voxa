import type { ChatCoachResponse, CoachProviderParams } from "./types.ts";

export type { CoachProviderParams };

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
    throw new Error("Gemini response missing reply");
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
          focus: reviewRaw.focus.trim(),
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

export async function callGeminiCoach(
  params: CoachProviderParams,
  apiKey: string,
  model = "gemini-2.0-flash-lite",
): Promise<ChatCoachResponse> {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const contents = params.messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: params.systemPrompt }] },
      contents,
      generationConfig: {
        temperature: 0.75,
        maxOutputTokens: params.maxOutputTokens,
        responseMimeType: "application/json",
      },
    }),
  });

  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`Gemini error ${res.status}: ${raw.slice(0, 240)}`);
  }

  const data = JSON.parse(raw) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini returned empty content");
  }

  return parseCoachJson(text);
}
