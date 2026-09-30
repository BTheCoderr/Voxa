import type { ScenarioId } from '@/constants/scenarios';
import { getScenario } from '@/constants/scenarios';
import type { SessionCoachReview } from '@/lib/ai/providers/types';
import type { ReviewedConversationItem } from '@/lib/db/conversations';
import type { Json } from '@/lib/db/database.types';
import {
  coachSkillLabel,
  isCoachSkillTag,
  type CoachSkillTag,
} from '@/lib/progress/coachSkills';

const SCENARIOS_BY_SKILL: Record<CoachSkillTag, ScenarioId[]> = {
  clarity: ['job_interview', 'customer_support', 'business_meeting'],
  grammar: ['small_talk', 'restaurant', 'travel'],
  vocabulary: ['travel', 'networking', 'restaurant'],
  fluency: ['small_talk', 'networking', 'dating'],
  natural_phrasing: ['small_talk', 'dating', 'networking'],
  professional_tone: ['business_meeting', 'job_interview', 'customer_support'],
  response_building: ['customer_support', 'job_interview', 'airport'],
  conversation_flow: ['networking', 'dating', 'small_talk'],
  conciseness: ['job_interview', 'business_meeting', 'customer_support'],
  politeness: ['restaurant', 'customer_support', 'travel'],
};

export type LearnerCoachMemory = {
  sessionsAnalyzed: number;
  confidence: 'starting' | 'forming' | 'established';
  primaryFocus: CoachSkillTag | null;
  secondaryFocus: CoachSkillTag | null;
  strongestSkill: CoachSkillTag | null;
  recommendedScenarioIds: ScenarioId[];
  latestReview: SessionCoachReview | null;
  headline: string;
  summary: string;
};

type RankedSkill = {
  tag: CoachSkillTag;
  count: number;
  firstIndex: number;
};

function asObject(value: Json | null): Record<string, Json | undefined> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value;
}

export function parseStoredCoachReview(value: Json | null): SessionCoachReview | null {
  const raw = asObject(value);
  if (!raw) return null;

  const suggestedScenarioId =
    typeof raw.suggestedScenarioId === 'string' ? raw.suggestedScenarioId : '';

  if (
    typeof raw.headline !== 'string' ||
    typeof raw.strength !== 'string' ||
    !isCoachSkillTag(raw.strengthTag) ||
    typeof raw.focus !== 'string' ||
    !isCoachSkillTag(raw.focusTag) ||
    typeof raw.nextMission !== 'string' ||
    !getScenario(suggestedScenarioId as ScenarioId)
  ) {
    return null;
  }

  return {
    headline: raw.headline,
    strength: raw.strength,
    strengthTag: raw.strengthTag,
    focus: raw.focus,
    focusTag: raw.focusTag,
    nextMission: raw.nextMission,
    suggestedScenarioId,
  };
}

function rankSkills(tags: CoachSkillTag[]): RankedSkill[] {
  const stats = new Map<CoachSkillTag, RankedSkill>();

  tags.forEach((tag, index) => {
    const existing = stats.get(tag);
    if (existing) {
      existing.count += 1;
      return;
    }
    stats.set(tag, { tag, count: 1, firstIndex: index });
  });

  return [...stats.values()].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.firstIndex - b.firstIndex;
  });
}

function buildScenarioPlan(
  primary: CoachSkillTag | null,
  secondary: CoachSkillTag | null,
  latestScenarioId?: string,
): ScenarioId[] {
  const candidates: ScenarioId[] = [];

  if (primary) candidates.push(...SCENARIOS_BY_SKILL[primary]);
  if (secondary) candidates.push(...SCENARIOS_BY_SKILL[secondary]);
  if (latestScenarioId && getScenario(latestScenarioId as ScenarioId)) {
    candidates.push(latestScenarioId as ScenarioId);
  }

  return [...new Set(candidates)].slice(0, 3);
}

export function buildLearnerCoachMemory(
  rows: ReviewedConversationItem[],
): LearnerCoachMemory {
  const reviews = rows
    .map((row) => parseStoredCoachReview(row.coach_review))
    .filter((review): review is SessionCoachReview => Boolean(review));

  const sessionsAnalyzed = reviews.length;
  const focusRanks = rankSkills(reviews.map((review) => review.focusTag));
  const strengthRanks = rankSkills(reviews.map((review) => review.strengthTag));

  const primaryFocus = focusRanks[0]?.tag ?? null;
  const secondaryFocus =
    focusRanks.find((item) => item.tag !== primaryFocus)?.tag ?? null;
  const strongestSkill = strengthRanks[0]?.tag ?? null;
  const latestReview = reviews[0] ?? null;
  const recommendedScenarioIds = buildScenarioPlan(
    primaryFocus,
    secondaryFocus,
    latestReview?.suggestedScenarioId,
  );

  const confidence: LearnerCoachMemory['confidence'] =
    sessionsAnalyzed >= 7 ? 'established' : sessionsAnalyzed >= 3 ? 'forming' : 'starting';

  if (sessionsAnalyzed === 0) {
    return {
      sessionsAnalyzed,
      confidence,
      primaryFocus,
      secondaryFocus,
      strongestSkill,
      recommendedScenarioIds,
      latestReview,
      headline: 'Your coaching pattern starts here',
      summary: 'Finish a coached session and Voxa will begin tracking the skills that keep showing up.',
    };
  }

  if (sessionsAnalyzed === 1) {
    return {
      sessionsAnalyzed,
      confidence,
      primaryFocus,
      secondaryFocus,
      strongestSkill,
      recommendedScenarioIds,
      latestReview,
      headline: 'One session remembered',
      summary: `Voxa is starting with ${primaryFocus ? coachSkillLabel(primaryFocus).toLowerCase() : 'your latest focus'}. Another coached session will help separate a pattern from a one-off note.`,
    };
  }

  const focusLabel = primaryFocus ? coachSkillLabel(primaryFocus) : 'Your current focus';
  const strengthLabel = strongestSkill ? coachSkillLabel(strongestSkill) : 'Your strengths';

  return {
    sessionsAnalyzed,
    confidence,
    primaryFocus,
    secondaryFocus,
    strongestSkill,
    recommendedScenarioIds,
    latestReview,
    headline: `${focusLabel} keeps showing up`,
    summary: `Across ${sessionsAnalyzed} recent coached sessions, ${focusLabel.toLowerCase()} is the most repeated focus. ${strengthLabel} is appearing most often as a strength.`,
  };
}
