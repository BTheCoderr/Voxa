export type ChatCoachCorrection = {
  original: string;
  improved: string;
  explanation: string;
};

export type ChatCoachResponse = {
  reply: string;
  corrections: ChatCoachCorrection[];
  encouragement: string;
};

export type CoachProviderParams = {
  scenarioId: string;
  learningPath: string;
  userLevel: string;
  messages: { role: "user" | "assistant"; content: string }[];
  systemPrompt: string;
};
