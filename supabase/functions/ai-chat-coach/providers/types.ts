export type ChatCoachCorrection = {
  original: string;
  improved: string;
  explanation: string;
};

export type SessionCoachReview = {
  headline: string;
  strength: string;
  focus: string;
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
  messages: { role: "user" | "assistant"; content: string }[];
  systemPrompt: string;
  maxOutputTokens: number;
};
