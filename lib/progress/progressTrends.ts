import type { CoachSkillTag } from '@/lib/progress/coachSkills';
import { coachSkillLabel } from '@/lib/progress/coachSkills';
import { parseStoredCoachReview } from '@/lib/progress/coachMemory';
import type { ProgressTrendConversation, ProgressTrendData } from '@/lib/db/conversations';
import type { UserLevel } from '@/lib/realtime/types';
import { practiceLevelLabel } from '@/lib/progress/adaptiveDifficulty';

export type ProgressTrendItemKind =
  | 'focus_less'
  | 'focus_more'
  | 'strength_more'
  | 'corrections'
  | 'range'
  | 'difficulty';

export type ProgressTrendItem = {
  id: string;
  kind: ProgressTrendItemKind;
  eyebrow: string;
  title: string;
  detail: string;
  recentLabel: string;
  earlierLabel: string;
};

export type ProgressTrendSummary = {
  ready: boolean;
  sessionsAvailable: number;
  windowSize: number;
  recentReviewedCount: number;
  earlierReviewedCount: number;
  headline: string;
  summary: string;
  items: ProgressTrendItem[];
};

function countIds(ids: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const id of ids) map.set(id, (map.get(id) ?? 0) + 1);
  return map;
}

function countSkillTags(tags: CoachSkillTag[]): Map<CoachSkillTag, number> {
  const map = new Map<CoachSkillTag, number>();
  for (const tag of tags) map.set(tag, (map.get(tag) ?? 0) + 1);
  return map;
}

function largestSkillChange(
  earlier: Map<CoachSkillTag, number>,
  recent: Map<CoachSkillTag, number>,
  direction: 'down' | 'up',
): { tag: CoachSkillTag; earlier: number; recent: number } | null {
  const tags = new Set<CoachSkillTag>([...earlier.keys(), ...recent.keys()]);
  let best: { tag: CoachSkillTag; earlier: number; recent: number; delta: number } | null = null;

  for (const tag of tags) {
    const earlierCount = earlier.get(tag) ?? 0;
    const recentCount = recent.get(tag) ?? 0;
    const delta = direction === 'down' ? earlierCount - recentCount : recentCount - earlierCount;
    if (delta <= 0) continue;
    if (!best || delta > best.delta) {
      best = { tag, earlier: earlierCount, recent: recentCount, delta };
    }
  }

  return best ? { tag: best.tag, earlier: best.earlier, recent: best.recent } : null;
}

function dominantLevel(rows: ProgressTrendConversation[]): { level: UserLevel; count: number } | null {
  const counts = new Map<UserLevel, number>();
  for (const row of rows) {
    const level = row.user_level as UserLevel;
    if (level !== 'beginner' && level !== 'intermediate' && level !== 'advanced') continue;
    counts.set(level, (counts.get(level) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([level, count]) => ({ level, count }))[0] ?? null;
}

function levelDistribution(rows: ProgressTrendConversation[]): string {
  const order: UserLevel[] = ['beginner', 'intermediate', 'advanced'];
  const counts = new Map<UserLevel, number>();
  for (const row of rows) {
    const level = row.user_level as UserLevel;
    if (!order.includes(level)) continue;
    counts.set(level, (counts.get(level) ?? 0) + 1);
  }

  const parts = order
    .map((level) => ({ level, count: counts.get(level) ?? 0 }))
    .filter((item) => item.count > 0)
    .map((item) => `${item.count} ${practiceLevelLabel(item.level)}`);

  return parts.join(' · ') || 'No level data';
}

export function buildProgressTrends(data: ProgressTrendData): ProgressTrendSummary {
  const sessionsAvailable = data.conversations.length;
  const windowSize = Math.min(4, Math.floor(sessionsAvailable / 2));

  if (windowSize < 3) {
    return {
      ready: false,
      sessionsAvailable,
      windowSize,
      recentReviewedCount: 0,
      earlierReviewedCount: 0,
      headline: 'Your trend line is still forming',
      summary:
        'Finish at least six completed sessions in this learning path. Voxa compares equally sized recent and earlier windows so the comparison stays fair.',
      items: [],
    };
  }

  const recent = data.conversations.slice(0, windowSize);
  const earlier = data.conversations.slice(windowSize, windowSize * 2);
  const userTurns = countIds(data.userMessageConversationIds);
  const corrections = countIds(data.correctionConversationIds);
  const items: ProgressTrendItem[] = [];

  const recentReviews = recent
    .map((row) => parseStoredCoachReview(row.coach_review))
    .filter((review): review is NonNullable<ReturnType<typeof parseStoredCoachReview>> => Boolean(review));
  const earlierReviews = earlier
    .map((row) => parseStoredCoachReview(row.coach_review))
    .filter((review): review is NonNullable<ReturnType<typeof parseStoredCoachReview>> => Boolean(review));

  if (recentReviews.length >= 2 && earlierReviews.length >= 2) {
    const recentFocus = countSkillTags(recentReviews.map((review) => review.focusTag));
    const earlierFocus = countSkillTags(earlierReviews.map((review) => review.focusTag));
    const focusLess = largestSkillChange(earlierFocus, recentFocus, 'down');
    const focusMore = largestSkillChange(earlierFocus, recentFocus, 'up');

    if (focusLess) {
      const label = coachSkillLabel(focusLess.tag);
      items.push({
        id: `focus-less:${focusLess.tag}`,
        kind: 'focus_less',
        eyebrow: 'Less often a coaching focus',
        title: `${label} is showing up less often`,
        detail: `${label} was the main coaching focus in ${focusLess.earlier} of ${earlierReviews.length} earlier reviewed sessions and ${focusLess.recent} of ${recentReviews.length} recent reviewed sessions.`,
        recentLabel: `${focusLess.recent} of ${recentReviews.length} recent`,
        earlierLabel: `${focusLess.earlier} of ${earlierReviews.length} earlier`,
      });
    } else if (focusMore) {
      const label = coachSkillLabel(focusMore.tag);
      items.push({
        id: `focus-more:${focusMore.tag}`,
        kind: 'focus_more',
        eyebrow: 'Showing up more as a focus',
        title: `${label} needs more attention recently`,
        detail: `${label} was the main coaching focus in ${focusMore.earlier} of ${earlierReviews.length} earlier reviewed sessions and ${focusMore.recent} of ${recentReviews.length} recent reviewed sessions.`,
        recentLabel: `${focusMore.recent} of ${recentReviews.length} recent`,
        earlierLabel: `${focusMore.earlier} of ${earlierReviews.length} earlier`,
      });
    }

    const recentStrength = countSkillTags(recentReviews.map((review) => review.strengthTag));
    const earlierStrength = countSkillTags(earlierReviews.map((review) => review.strengthTag));
    const strengthMore = largestSkillChange(earlierStrength, recentStrength, 'up');

    if (strengthMore) {
      const label = coachSkillLabel(strengthMore.tag);
      items.push({
        id: `strength-more:${strengthMore.tag}`,
        kind: 'strength_more',
        eyebrow: 'Emerging strength',
        title: `${label} is appearing more as a strength`,
        detail: `${label} was tagged as a strength in ${strengthMore.earlier} of ${earlierReviews.length} earlier reviewed sessions and ${strengthMore.recent} of ${recentReviews.length} recent reviewed sessions.`,
        recentLabel: `${strengthMore.recent} of ${recentReviews.length} recent`,
        earlierLabel: `${strengthMore.earlier} of ${earlierReviews.length} earlier`,
      });
    }
  }

  const recentTurns = recent.reduce((sum, row) => sum + (userTurns.get(row.id) ?? 0), 0);
  const earlierTurns = earlier.reduce((sum, row) => sum + (userTurns.get(row.id) ?? 0), 0);
  const recentCorrections = recent.reduce((sum, row) => sum + (corrections.get(row.id) ?? 0), 0);
  const earlierCorrections = earlier.reduce((sum, row) => sum + (corrections.get(row.id) ?? 0), 0);

  if (recentTurns >= 4 && earlierTurns >= 4) {
    const recentRate = recentCorrections / recentTurns;
    const earlierRate = earlierCorrections / earlierTurns;
    const delta = recentRate - earlierRate;
    const title =
      Math.abs(delta) < 0.08
        ? 'Saved correction frequency is fairly steady'
        : delta < 0
          ? 'Fewer corrections are being saved per learner turn'
          : 'More corrections are being saved per learner turn';

    items.push({
      id: 'correction-frequency',
      kind: 'corrections',
      eyebrow: 'Correction activity',
      title,
      detail: `Recent window: ${recentCorrections} saved corrections across ${recentTurns} learner turns. Earlier window: ${earlierCorrections} across ${earlierTurns}. This is coaching activity, not a proficiency score.`,
      recentLabel: `${recentCorrections} / ${recentTurns} turns`,
      earlierLabel: `${earlierCorrections} / ${earlierTurns} turns`,
    });
  }

  const recentRange = new Set(recent.map((row) => row.scenario_id)).size;
  const earlierRange = new Set(earlier.map((row) => row.scenario_id)).size;
  const rangeTitle =
    recentRange > earlierRange
      ? 'You are practicing across more situations'
      : recentRange < earlierRange
        ? 'Recent practice is more concentrated'
        : 'Your scenario range is steady';

  items.push({
    id: 'scenario-range',
    kind: 'range',
    eyebrow: 'Practice range',
    title: rangeTitle,
    detail: `The recent ${windowSize}-session window used ${recentRange} distinct scenarios. The earlier ${windowSize}-session window used ${earlierRange}.`,
    recentLabel: `${recentRange} scenarios`,
    earlierLabel: `${earlierRange} scenarios`,
  });

  const recentLevel = dominantLevel(recent);
  const earlierLevel = dominantLevel(earlier);
  if (recentLevel || earlierLevel) {
    const changed = recentLevel?.level !== earlierLevel?.level;
    items.push({
      id: 'difficulty-context',
      kind: 'difficulty',
      eyebrow: 'Difficulty context',
      title: changed ? 'Your practiced difficulty changed' : 'Your practiced difficulty is consistent',
      detail:
        'This context matters when reading other trends: harder sessions can naturally create more coaching corrections without meaning your skill went backward.',
      recentLabel: levelDistribution(recent),
      earlierLabel: levelDistribution(earlier),
    });
  }

  const hasSkillComparison = recentReviews.length >= 2 && earlierReviews.length >= 2;
  const headline = hasSkillComparison
    ? 'Your recent practice has a pattern'
    : 'Your behavior trends are visible now';
  const summary = hasSkillComparison
    ? `Comparing your latest ${windowSize} completed sessions with the ${windowSize} before them on this learning path.`
    : `Voxa can compare range, correction activity, and difficulty now. Strength/focus trends will unlock after at least two saved Coach Recaps exist in each comparison window.`;

  return {
    ready: true,
    sessionsAvailable,
    windowSize,
    recentReviewedCount: recentReviews.length,
    earlierReviewedCount: earlierReviews.length,
    headline,
    summary,
    items,
  };
}