import type { SupabaseClient } from '@supabase/supabase-js';

import { getScenario, SCENARIOS, type ScenarioId } from '@/constants/scenarios';
import {
  getCompletedConversationsBetween,
  getCorrectionMasteryData,
  getRecentReviewedConversations,
  type WeeklyCompletedConversation,
} from '@/lib/db/conversations';
import type { Database } from '@/lib/db/database.types';
import { coachSkillLabel } from '@/lib/progress/coachSkills';
import {
  buildLearnerCoachMemory,
  type LearnerCoachMemory,
} from '@/lib/progress/coachMemory';
import {
  buildCorrectionMastery,
  type CorrectionMasteryPattern,
  type CorrectionMasterySummary,
} from '@/lib/progress/correctionMastery';
import type { ApiLearningPath } from '@/lib/realtime/learningPath';

export type WeeklyCoachPlanSource = 'coach_memory' | 'correction_mastery' | 'range' | 'foundation';

export type WeeklyCoachPlanItem = {
  id: string;
  order: number;
  source: WeeklyCoachPlanSource;
  scenarioId: ScenarioId;
  scenarioTitle: string;
  focus: string;
  mission: string;
  reason: string;
  completed: boolean;
  completedConversationId: string | null;
  completedAt: string | null;
};

export type WeeklyCoachPlan = {
  weekKey: string;
  weekStartIso: string;
  weekEndIso: string;
  completedCount: number;
  totalCount: number;
  items: WeeklyCoachPlanItem[];
  headline: string;
  summary: string;
};

export type WeekBounds = {
  key: string;
  start: Date;
  end: Date;
};

const FOUNDATION_SCENARIOS: ScenarioId[] = [
  'small_talk',
  'networking',
  'job_interview',
  'travel',
  'business_meeting',
  'customer_support',
];

export function getLocalWeekBounds(now = new Date()): WeekBounds {
  const start = new Date(now);
  const day = start.getDay();
  const daysSinceMonday = (day + 6) % 7;

  start.setDate(start.getDate() - daysSinceMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const yyyy = start.getFullYear();
  const mm = String(start.getMonth() + 1).padStart(2, '0');
  const dd = String(start.getDate()).padStart(2, '0');

  return {
    key: `${yyyy}-${mm}-${dd}`,
    start,
    end,
  };
}

function scenarioOrFallback(id: ScenarioId): NonNullable<ReturnType<typeof getScenario>> {
  return getScenario(id) ?? SCENARIOS[0]!;
}

function firstUniqueScenario(
  candidates: ScenarioId[],
  used: Set<ScenarioId>,
): ScenarioId | null {
  return candidates.find((scenarioId) => !used.has(scenarioId)) ?? null;
}

function activeCorrectionPattern(
  mastery: CorrectionMasterySummary,
  used: Set<ScenarioId>,
): CorrectionMasteryPattern | null {
  return (
    mastery.patterns.find(
      (pattern) => pattern.status === 'recurring' && !used.has(pattern.scenarioId),
    ) ??
    mastery.patterns.find(
      (pattern) => pattern.status === 'new' && !used.has(pattern.scenarioId),
    ) ??
    mastery.patterns.find(
      (pattern) => pattern.status === 'improving' && !used.has(pattern.scenarioId),
    ) ??
    null
  );
}

function weekRotationOffset(weekKey: string): number {
  return [...weekKey].reduce((total, char) => total + char.charCodeAt(0), 0) % FOUNDATION_SCENARIOS.length;
}

function rotatedFoundation(weekKey: string): ScenarioId[] {
  const offset = weekRotationOffset(weekKey);
  return [
    ...FOUNDATION_SCENARIOS.slice(offset),
    ...FOUNDATION_SCENARIOS.slice(0, offset),
  ];
}

function assignCompletions(
  items: Omit<WeeklyCoachPlanItem, 'completed' | 'completedConversationId' | 'completedAt'>[],
  completedThisWeek: WeeklyCompletedConversation[],
): WeeklyCoachPlanItem[] {
  const unused = [...completedThisWeek];

  return items.map((item) => {
    const matchIndex = unused.findIndex(
      (conversation) => conversation.scenario_id === item.scenarioId,
    );

    if (matchIndex === -1) {
      return {
        ...item,
        completed: false,
        completedConversationId: null,
        completedAt: null,
      };
    }

    const [match] = unused.splice(matchIndex, 1);
    return {
      ...item,
      completed: true,
      completedConversationId: match?.id ?? null,
      completedAt: match?.ended_at ?? null,
    };
  });
}

export function buildWeeklyCoachPlan(args: {
  memory: LearnerCoachMemory;
  mastery: CorrectionMasterySummary;
  completedThisWeek: WeeklyCompletedConversation[];
  week: WeekBounds;
}): WeeklyCoachPlan {
  const { memory, mastery, completedThisWeek, week } = args;
  const used = new Set<ScenarioId>();
  const items: Omit<
    WeeklyCoachPlanItem,
    'completed' | 'completedConversationId' | 'completedAt'
  >[] = [];

  const addItem = (
    source: WeeklyCoachPlanSource,
    scenarioId: ScenarioId,
    focus: string,
    mission: string,
    reason: string,
  ) => {
    if (used.has(scenarioId)) return;
    const scenario = scenarioOrFallback(scenarioId);
    used.add(scenario.id);
    items.push({
      id: `${week.key}:${source}:${scenario.id}`,
      order: items.length + 1,
      source,
      scenarioId: scenario.id,
      scenarioTitle: scenario.title,
      focus,
      mission,
      reason,
    });
  };

  const primaryScenarioId =
    firstUniqueScenario(memory.recommendedScenarioIds, used) ??
    firstUniqueScenario(rotatedFoundation(week.key), used);

  if (primaryScenarioId) {
    const primaryLabel = memory.primaryFocus
      ? coachSkillLabel(memory.primaryFocus)
      : scenarioOrFallback(primaryScenarioId).focus;

    addItem(
      memory.primaryFocus ? 'coach_memory' : 'foundation',
      primaryScenarioId,
      primaryLabel,
      memory.latestReview?.suggestedScenarioId === primaryScenarioId
        ? memory.latestReview.nextMission
        : `Use this session to make ${primaryLabel.toLowerCase()} feel more automatic.`,
      memory.primaryFocus
        ? `${primaryLabel} was the strongest repeated coaching focus before this week began.`
        : 'Voxa needs more coached history, so this week starts with a balanced foundation session.',
    );
  }

  const correction = activeCorrectionPattern(mastery, used);
  if (correction) {
    addItem(
      'correction_mastery',
      correction.scenarioId,
      correction.focus,
      correction.mission,
      correction.status === 'recurring'
        ? `“${correction.targetPhrase}” had resurfaced across multiple sessions before this week.`
        : correction.status === 'improving'
          ? `“${correction.targetPhrase}” was getting quieter, so this is a reinforcement rep.`
          : `“${correction.targetPhrase}” was a recent correction worth practicing before it becomes a pattern.`,
    );
  }

  const secondaryCandidates = [
    ...memory.recommendedScenarioIds,
    ...rotatedFoundation(week.key),
  ];
  const secondaryScenarioId = firstUniqueScenario(secondaryCandidates, used);

  if (secondaryScenarioId) {
    const secondaryLabel = memory.secondaryFocus
      ? coachSkillLabel(memory.secondaryFocus)
      : memory.strongestSkill
        ? coachSkillLabel(memory.strongestSkill)
        : scenarioOrFallback(secondaryScenarioId).focus;

    addItem(
      memory.secondaryFocus || memory.strongestSkill ? 'range' : 'foundation',
      secondaryScenarioId,
      secondaryLabel,
      `Practice ${secondaryLabel.toLowerCase()} in a different situation so the skill transfers beyond one scenario.`,
      memory.secondaryFocus
        ? `${secondaryLabel} was the next-most repeated focus before this week.`
        : memory.strongestSkill
          ? `${secondaryLabel} was a repeated strength worth protecting while you build range.`
          : 'A second situation keeps practice from becoming too narrow.',
    );
  }

  const hasPriorEvidence = memory.sessionsAnalyzed > 0 || mastery.patterns.length > 0;
  const targetCount = hasPriorEvidence ? 3 : 2;

  for (const scenarioId of rotatedFoundation(week.key)) {
    if (items.length >= targetCount) break;
    if (used.has(scenarioId)) continue;
    const scenario = scenarioOrFallback(scenarioId);
    addItem(
      'foundation',
      scenario.id,
      scenario.focus,
      scenario.mission,
      'This foundation rep gives the week useful variety while Voxa gathers stronger personal patterns.',
    );
  }

  const completedItems = assignCompletions(items.slice(0, targetCount), completedThisWeek);
  const completedCount = completedItems.filter((item) => item.completed).length;
  const totalCount = completedItems.length;

  let headline = 'Your week is ready';
  let summary = `${totalCount} focused sessions, built from what Voxa knew before this week started.`;

  if (completedCount === totalCount && totalCount > 0) {
    headline = 'Weekly plan complete';
    summary = 'You finished every planned rep. Keep practicing freely or reinforce something from Correction Mastery.';
  } else if (completedCount > 0) {
    headline = `${totalCount - completedCount} ${totalCount - completedCount === 1 ? 'session' : 'sessions'} left this week`;
    summary = `${completedCount} of ${totalCount} planned sessions complete. The remaining reps stay fixed until next Monday.`;
  }

  return {
    weekKey: week.key,
    weekStartIso: week.start.toISOString(),
    weekEndIso: week.end.toISOString(),
    completedCount,
    totalCount,
    items: completedItems,
    headline,
    summary,
  };
}


export async function loadWeeklyCoachPlan(
  client: SupabaseClient<Database>,
  userId: string,
  learningPath: ApiLearningPath,
  now = new Date(),
): Promise<WeeklyCoachPlan> {
  const week = getLocalWeekBounds(now);
  const weekStartIso = week.start.toISOString();
  const weekEndIso = week.end.toISOString();

  const [reviewRows, masteryData, completedThisWeek] = await Promise.all([
    getRecentReviewedConversations(client, userId, learningPath, 10, weekStartIso),
    getCorrectionMasteryData(client, userId, learningPath, 30, weekStartIso),
    getCompletedConversationsBetween(
      client,
      userId,
      learningPath,
      weekStartIso,
      weekEndIso,
    ),
  ]);

  return buildWeeklyCoachPlan({
    memory: buildLearnerCoachMemory(reviewRows),
    mastery: buildCorrectionMastery(masteryData),
    completedThisWeek,
    week,
  });
}
