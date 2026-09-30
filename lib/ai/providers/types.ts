import type { CoachSkillTag } from '@/lib/progress/coachSkills';
import type { ApiLearningPath } from '@/lib/realtime/learningPath';
import type { UserLevel } from '@/lib/realtime/types';

export type ChatCoachMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type ChatCoachCorrection = {
  original: string;
  improved: string;
  explanation: string;
};

export type SessionCoachReview = {
  headline: string;
  strength: string;
  strengthTag: CoachSkillTag;
  focus: string;
  focusTag: CoachSkillTag;
  nextMission: string;
  suggestedScenarioId: string;
};

export type ChatCoachRequest = {
  scenarioId: string;
  learningPath: ApiLearningPath;
  userLevel: UserLevel;
  mode?: 'practice' | 'review';
  sessionGoal?: string;
  messages: ChatCoachMessage[];
};

export type ChatCoachResponse = {
  reply: string;
  corrections: ChatCoachCorrection[];
  encouragement: string;
  review?: SessionCoachReview;
  /** Present when Edge Function includes `_meta.providerUsed`. */
  providerUsed?: string;
  /** Present when Edge Function includes `_meta.usedFallback`. */
  usedFallback?: boolean;
};

export type AiProviderId = 'gemini' | 'groq';

/** Params passed to server-side provider implementations (Edge Function only). */
export type CoachProviderParams = ChatCoachRequest & {
  systemPrompt: string;
  maxOutputTokens?: number;
};
