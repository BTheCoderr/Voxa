import type { Scenario } from '@/constants/scenarios';
import type { ChatCoachCorrection, SessionCoachReview } from '@/lib/ai/providers/types';
import type { CoachSkillTag } from '@/lib/progress/coachSkills';

const DEFAULT_FOCUS_BY_SCENARIO: Record<Scenario['id'], CoachSkillTag> = {
  job_interview: 'conciseness',
  business_meeting: 'professional_tone',
  networking: 'conversation_flow',
  small_talk: 'natural_phrasing',
  airport: 'response_building',
  restaurant: 'politeness',
  customer_support: 'clarity',
  travel: 'vocabulary',
  dating: 'conversation_flow',
};

export function fallbackSessionReview(
  scenario: Scenario,
  corrections: ChatCoachCorrection[] = [],
): SessionCoachReview {
  const firstCorrection = corrections.find((item) => item.improved || item.explanation);
  const focusTag = DEFAULT_FOCUS_BY_SCENARIO[scenario.id];

  return {
    headline: `${scenario.title} complete`,
    strength: `You stayed in the conversation and practiced ${scenario.focus.toLowerCase()} instead of only studying it.`,
    strengthTag: 'conversation_flow',
    focus:
      firstCorrection?.explanation ||
      firstCorrection?.improved ||
      `Keep sharpening ${scenario.focus.toLowerCase()} with another short rep.`,
    focusTag,
    nextMission: scenario.mission,
    suggestedScenarioId: scenario.id,
  };
}

export function sessionSummaryFromReview(review: SessionCoachReview): string {
  return `${review.headline}. Next focus: ${review.focus}`;
}
