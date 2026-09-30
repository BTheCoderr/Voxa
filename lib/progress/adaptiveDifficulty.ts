import type { UserLevel } from '@/lib/realtime/types';
import type { AdaptiveDifficultyData } from '@/lib/db/conversations';

export type DifficultyRecommendationKind = 'more_challenge' | 'more_support' | 'keep_level' | 'need_more_data';

export type DifficultyRecommendation = {
  kind: DifficultyRecommendationKind;
  currentLevel: UserLevel;
  suggestedLevel: UserLevel | null;
  sessionsAnalyzed: number;
  userTurnsAnalyzed: number;
  correctionsAnalyzed: number;
  correctionRate: number | null;
  headline: string;
  summary: string;
};

export function practiceLevelLabel(level: UserLevel): string {
  switch (level) {
    case 'beginner':
      return 'Beginner';
    case 'advanced':
      return 'Advanced';
    case 'intermediate':
    default:
      return 'Intermediate';
  }
}

export function practiceLevelDescription(level: UserLevel): string {
  switch (level) {
    case 'beginner':
      return 'Shorter turns, simpler vocabulary, more scaffolding, and fewer corrections at once.';
    case 'advanced':
      return 'Natural pace, more nuance and idioms, less scaffolding, and subtler corrections.';
    case 'intermediate':
    default:
      return 'Natural conversation with richer vocabulary and compact coaching when it helps.';
  }
}

function nextLevel(level: UserLevel): UserLevel | null {
  if (level === 'beginner') return 'intermediate';
  if (level === 'intermediate') return 'advanced';
  return null;
}

function previousLevel(level: UserLevel): UserLevel | null {
  if (level === 'advanced') return 'intermediate';
  if (level === 'intermediate') return 'beginner';
  return null;
}

function countByConversation(ids: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const id of ids) {
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

export function buildDifficultyRecommendation(
  data: AdaptiveDifficultyData,
  currentLevel: UserLevel,
): DifficultyRecommendation {
  const userTurnsByConversation = countByConversation(data.userMessageConversationIds);
  const correctionsByConversation = countByConversation(data.correctionConversationIds);

  const matchingSessions = data.conversations
    .filter((conversation) => conversation.user_level === currentLevel)
    .slice(0, 5)
    .map((conversation) => {
      const userTurns = userTurnsByConversation.get(conversation.id) ?? 0;
      const corrections = correctionsByConversation.get(conversation.id) ?? 0;
      return {
        id: conversation.id,
        userTurns,
        corrections,
        rate: userTurns > 0 ? corrections / userTurns : null,
      };
    })
    .filter((session) => session.userTurns > 0);

  const sessionsAnalyzed = matchingSessions.length;
  const userTurnsAnalyzed = matchingSessions.reduce((sum, session) => sum + session.userTurns, 0);
  const correctionsAnalyzed = matchingSessions.reduce((sum, session) => sum + session.corrections, 0);
  const correctionRate =
    userTurnsAnalyzed > 0 ? correctionsAnalyzed / userTurnsAnalyzed : null;

  if (sessionsAnalyzed < 4 || userTurnsAnalyzed < 12 || correctionRate === null) {
    return {
      kind: 'need_more_data',
      currentLevel,
      suggestedLevel: null,
      sessionsAnalyzed,
      userTurnsAnalyzed,
      correctionsAnalyzed,
      correctionRate,
      headline: `Stay at ${practiceLevelLabel(currentLevel)} for now`,
      summary:
        'Voxa needs at least four completed sessions and enough real conversation turns at this level before suggesting a change.',
    };
  }

  const lowCorrectionSessions = matchingSessions.filter(
    (session) => session.rate !== null && session.rate <= 0.25,
  ).length;
  const highCorrectionSessions = matchingSessions.filter(
    (session) => session.rate !== null && session.rate >= 0.55,
  ).length;

  const harderLevel = nextLevel(currentLevel);
  if (harderLevel && correctionRate <= 0.2 && lowCorrectionSessions >= 3) {
    return {
      kind: 'more_challenge',
      currentLevel,
      suggestedLevel: harderLevel,
      sessionsAnalyzed,
      userTurnsAnalyzed,
      correctionsAnalyzed,
      correctionRate,
      headline: `You may be ready for ${practiceLevelLabel(harderLevel)}`,
      summary:
        'Recent sessions at this level have needed relatively few saved corrections across real conversation turns. Voxa can add more challenge if you want it.',
    };
  }

  const easierLevel = previousLevel(currentLevel);
  if (easierLevel && correctionRate >= 0.55 && highCorrectionSessions >= 3) {
    return {
      kind: 'more_support',
      currentLevel,
      suggestedLevel: easierLevel,
      sessionsAnalyzed,
      userTurnsAnalyzed,
      correctionsAnalyzed,
      correctionRate,
      headline: `${practiceLevelLabel(easierLevel)} may feel better right now`,
      summary:
        'Corrections are showing up very frequently across recent sessions. A little more scaffolding may make practice more useful, but the choice stays yours.',
    };
  }

  return {
    kind: 'keep_level',
    currentLevel,
    suggestedLevel: null,
    sessionsAnalyzed,
    userTurnsAnalyzed,
    correctionsAnalyzed,
    correctionRate,
    headline: `${practiceLevelLabel(currentLevel)} looks like a good fit`,
    summary:
      'Recent practice does not show a strong reason to change difficulty yet. Keep building consistency and Voxa will keep watching the pattern.',
  };
}