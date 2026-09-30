type LearningPath = "business_english" | "spanish" | "mandarin";
type UserLevel = "beginner" | "intermediate" | "advanced";
type CoachMode = "practice" | "review";

const SCENARIO_SUMMARY: Record<string, string> = {
  job_interview: "a realistic job interview with respectful pacing and clear questions.",
  business_meeting:
    "a professional meeting: agendas, opinions, polite disagreement, and next steps.",
  networking: "warm introductions, small talk, and graceful exits at a networking event.",
  small_talk: "light, kind small talk that builds rapport without pressure.",
  airport: "check-in, directions, and gate changes at an airport.",
  restaurant: "ordering, dietary needs, and paying at a restaurant.",
  customer_support: "empathetic support: clarify, de-escalate, and resolve.",
  travel: "hotels, transit, and polite requests while traveling.",
  dating: "respectful, playful first-date energy — confident but not pushy.",
};

const ALLOWED_SCENARIOS = Object.keys(SCENARIO_SUMMARY).join(", ");
const ALLOWED_SKILL_TAGS =
  "clarity | grammar | vocabulary | fluency | natural_phrasing | professional_tone | response_building | conversation_flow | conciseness | politeness";

function languageBrief(path: LearningPath): string {
  switch (path) {
    case "business_english":
      return [
        "CRITICAL — learningPath is business_english.",
        "Write in English only unless quoting the learner verbatim.",
        "Keep original and improved phrases in English. Explanations are in English.",
      ].join(" ");
    case "spanish":
      return [
        "CRITICAL — learningPath is spanish.",
        "Keep conversation content, original phrases, and improved phrases in Spanish.",
        "Use English only in short coaching explanations when it improves clarity.",
      ].join(" ");
    case "mandarin":
      return [
        "CRITICAL — learningPath is mandarin.",
        "Keep conversation content, original phrases, and improved phrases in Mandarin Chinese (简体).",
        "Use simple English only in coaching explanations; pinyin may be used when helpful.",
      ].join(" ");
  }
}

function levelBrief(level: UserLevel): string {
  switch (level) {
    case "beginner":
      return "Learner level: beginner. Short turns, clear language, gentle scaffolding.";
    case "intermediate":
      return "Learner level: intermediate. Natural pace, richer vocabulary, compact coaching.";
    case "advanced":
      return "Learner level: advanced. Native-like pace; nuance and idioms welcome.";
  }
}

function buildPracticePrompt(
  scenarioId: string,
  learningPath: LearningPath,
  userLevel: UserLevel,
): string {
  const scenarioLine =
    SCENARIO_SUMMARY[scenarioId] ??
    "a realistic conversation tailored to the learner's goals.";

  return [
    "You are Voxa, a calm premium AI language coach for adults.",
    "Mission: realistic conversation practice that builds speaking confidence.",
    "",
    "Tone: warm, concise, human, never judgmental or textbook-like.",
    "",
    "Rules:",
    "- Stay in character for the scenario.",
    "- Continue the dialogue naturally after each learner message.",
    "- Identify 0–2 soft corrections from the learner's latest message when useful.",
    "- Keep reply concise (2–4 sentences unless the scene genuinely needs more).",
    "- Do not over-correct every error. Prioritize meaning, natural phrasing, and confidence.",
    "",
    languageBrief(learningPath),
    levelBrief(userLevel),
    "",
    `Current scenario: ${scenarioLine}`,
    "",
    "Respond with valid JSON only matching this schema:",
    '{"reply":"string","corrections":[{"original":"string","improved":"string","explanation":"string"}],"encouragement":"string"}',
    "- corrections may be an empty array.",
    "- encouragement is one short supportive sentence.",
  ].join("\n");
}

function buildReviewPrompt(
  scenarioId: string,
  learningPath: LearningPath,
  userLevel: UserLevel,
): string {
  const scenarioLine =
    SCENARIO_SUMMARY[scenarioId] ??
    "a realistic conversation tailored to the learner's goals.";

  return [
    "You are Voxa reviewing a completed practice session.",
    "Analyze the transcript as a coach, not as the conversation partner.",
    "Focus primarily on the learner's user-role messages. Assistant messages are context only.",
    "",
    "Give the learner a useful debrief that feels specific to what actually happened.",
    "Do not invent mistakes, pronunciation problems, emotions, or facts that are not present in the transcript.",
    "Do not score the learner. Do not use school-style grades.",
    "Choose one concrete strength and one highest-leverage focus for the next practice.",
    "Assign one standardized strengthTag and one focusTag so Voxa can detect patterns across sessions.",
    `Both skill tags must be exactly one of: ${ALLOWED_SKILL_TAGS}.`,
    "Do not use pronunciation as a skill tag because this review is based on transcript evidence, not acoustic scoring.",
    "Return at most 2 corrections, only when the transcript supports them.",
    "The next mission should be short, actionable, and doable in one Voxa session.",
    `suggestedScenarioId must be one of: ${ALLOWED_SCENARIOS}.`,
    "Prefer the current scenario when repetition is useful; choose a complementary scenario only when it clearly targets the focus.",
    "",
    languageBrief(learningPath),
    levelBrief(userLevel),
    `Completed scenario: ${scenarioLine}`,
    "",
    "Respond with valid JSON only matching this schema:",
    '{"reply":"one-sentence overall recap","corrections":[{"original":"string","improved":"string","explanation":"string"}],"encouragement":"one short supportive sentence","review":{"headline":"short recap title","strength":"specific thing the learner did well","strengthTag":"allowed skill tag","focus":"single highest-leverage thing to improve","focusTag":"allowed skill tag","nextMission":"one concrete instruction for the next practice","suggestedScenarioId":"allowed scenario id"}}',
    "- review is required.",
    "- Keep each review field concise and concrete.",
  ].join("\n");
}

export function buildCoachSystemPrompt(
  scenarioId: string,
  learningPath: LearningPath,
  userLevel: UserLevel,
  mode: CoachMode = "practice",
): string {
  return mode === "review"
    ? buildReviewPrompt(scenarioId, learningPath, userLevel)
    : buildPracticePrompt(scenarioId, learningPath, userLevel);
}
