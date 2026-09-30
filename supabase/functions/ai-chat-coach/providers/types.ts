export type ChatCoachCorrection = {
  original: string;
  improved: string;
  explanation: string;
};

export type CoachSkillTag =
  | "clarity"
  | "grammar"
  | "vocabulary"
  | "fluency"
  | "natural_phrasing"
  | "professional_tone"
  | "response_building"
  | "conversation_flow"
  | "conciseness"
  | "politeness";

export type SessionCoachReview = {
  headline: string;
  strength: string;
  strengthTag: CoachSkillTag;
  focus: string;
  focusTag: CoachSkillTag;
  nextMission: string;
  suggestedScenarioId: string;
};

export type ChatCoachResponse = {
  reply: string;
  corrections: ChatCoachCorrection[];
  encouragement: string;
  review?: SessionCoachReview;
};

export type CoachProviderParams = {
  scenarioId: string;
  learningPath: string;
  userLevel: string;
  mode: "practice" | "review";
  sessionGoal?: string;
  messages: { role: "user" | "assistant"; content: string }[];
  systemPrompt: string;
  maxOutputTokens: number;
};
