import type { Scenario } from '@/constants/scenarios';
import type { ChatCoachCorrection, SessionCoachReview } from '@/lib/ai/providers/types';

export function fallbackSessionReview(
  scenario: Scenario,
  corrections: ChatCoachCorrection[] = [],
): SessionCoachReview {
  const firstCorrection = corrections.find((item) => item.improved || item.explanation);

  return {
    headline: `${scenario.title} complete`,
    strength: `You stayed in the conversation and practiced ${scenario.focus.toLowerCase()} instead of only studying it.`,
    focus:
      firstCorrection?.explanation ||
      firstCorrection?.improved ||
      `Keep sharpening ${scenario.focus.toLowerCase()} with another short rep.`,
    nextMission: scenario.mission,
    suggestedScenarioId: scenario.id,
  };
}

export function sessionSummaryFromReview(review: SessionCoachReview): string {
  return `${review.headline}. Next focus: ${review.focus}`;
}
