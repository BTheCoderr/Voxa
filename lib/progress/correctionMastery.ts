import { getScenario, type ScenarioId } from '@/constants/scenarios';
import type {
  CorrectionMasteryConversation,
  CorrectionMasteryData,
} from '@/lib/db/conversations';
import type { CorrectionRow } from '@/lib/db/database.types';
import type { ApiLearningPath } from '@/lib/realtime/learningPath';

export type CorrectionMasteryStatus = 'new' | 'recurring' | 'improving' | 'mastered';

export type CorrectionMasteryPattern = {
  id: string;
  status: CorrectionMasteryStatus;
  targetPhrase: string;
  originalPhrase: string | null;
  explanation: string | null;
  occurrenceCount: number;
  sessionCount: number;
  sessionsSinceLastSeen: number;
  firstSeenAt: string;
  lastSeenAt: string;
  scenarioId: ScenarioId;
  scenarioTitle: string;
  learningPath: ApiLearningPath;
  focus: string;
  mission: string;
  evidence: string;
};

export type CorrectionMasterySummary = {
  patterns: CorrectionMasteryPattern[];
  recurringCount: number;
  improvingCount: number;
  masteredCount: number;
  newCount: number;
  headline: string;
  summary: string;
};

type WorkingCorrection = {
  correction: CorrectionRow;
  conversation: CorrectionMasteryConversation;
  targetPhrase: string;
  normalizedTarget: string;
};

type WorkingGroup = {
  representative: WorkingCorrection;
  items: WorkingCorrection[];
};

function cleanPhrase(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function correctionTarget(correction: CorrectionRow): string {
  return cleanPhrase(
    correction.improved ||
      correction.original ||
      correction.body ||
      'Saved correction',
  );
}

function normalizePhrase(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenSet(value: string): Set<string> {
  return new Set(value.split(' ').filter(Boolean));
}

function overlapRatio(a: Set<string>, b: Set<string>): {
  jaccard: number;
  containment: number;
  intersection: number;
} {
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }

  const union = new Set([...a, ...b]).size;
  const minSize = Math.min(a.size, b.size);

  return {
    jaccard: union > 0 ? intersection / union : 0,
    containment: minSize > 0 ? intersection / minSize : 0,
    intersection,
  };
}

function bigrams(value: string): Set<string> {
  const compact = value.replace(/\s+/g, '');
  const grams = new Set<string>();
  if (compact.length < 2) return grams;

  for (let index = 0; index < compact.length - 1; index += 1) {
    grams.add(compact.slice(index, index + 2));
  }
  return grams;
}

function diceSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;

  let intersection = 0;
  for (const gram of a) {
    if (b.has(gram)) intersection += 1;
  }

  return (2 * intersection) / (a.size + b.size);
}

function areSimilarTargets(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;

  const aTokens = tokenSet(a);
  const bTokens = tokenSet(b);

  if (aTokens.size >= 3 && bTokens.size >= 3) {
    const overlap = overlapRatio(aTokens, bTokens);
    if (overlap.jaccard >= 0.75) return true;
    if (overlap.intersection >= 3 && overlap.containment >= 0.88) return true;
  }

  const hasWhitespace = a.includes(' ') || b.includes(' ');
  if (!hasWhitespace && a.length >= 6 && b.length >= 6) {
    return diceSimilarity(bigrams(a), bigrams(b)) >= 0.9;
  }

  return false;
}

function buildStatus(
  sessionCount: number,
  sessionsSinceLastSeen: number,
): CorrectionMasteryStatus {
  if (sessionCount < 2) return 'new';
  if (sessionsSinceLastSeen >= 4) return 'mastered';
  if (sessionsSinceLastSeen >= 2) return 'improving';
  return 'recurring';
}

function evidenceFor(
  status: CorrectionMasteryStatus,
  sessionCount: number,
  sessionsSinceLastSeen: number,
): string {
  switch (status) {
    case 'recurring':
      return sessionsSinceLastSeen === 0
        ? `This correction has appeared in ${sessionCount} different sessions and showed up again in your latest completed practice.`
        : `This correction has appeared in ${sessionCount} different sessions and is still recent.`;
    case 'improving':
      return `It appeared in ${sessionCount} different sessions, then stayed quiet across ${sessionsSinceLastSeen} later completed sessions.`;
    case 'mastered':
      return `It appeared in ${sessionCount} different sessions and has not resurfaced across ${sessionsSinceLastSeen} later completed sessions.`;
    case 'new':
    default:
      return sessionsSinceLastSeen === 0
        ? 'This is a recent correction. Voxa needs more sessions before calling it a recurring pattern.'
        : 'This has only appeared once so far, so Voxa is not treating it as a recurring weakness.';
  }
}

function missionFor(targetPhrase: string, explanation: string | null): string {
  const phraseMission = `Use “${targetPhrase}” naturally at least three times in the conversation.`;
  if (!explanation) return phraseMission;
  return `${phraseMission} Keep this coaching note in mind: ${explanation}`;
}

function statusWeight(status: CorrectionMasteryStatus): number {
  switch (status) {
    case 'recurring':
      return 0;
    case 'improving':
      return 1;
    case 'new':
      return 2;
    case 'mastered':
      return 3;
  }
}

function asApiLearningPath(value: string): ApiLearningPath | null {
  if (value === 'business_english' || value === 'spanish' || value === 'mandarin') {
    return value;
  }
  return null;
}

export function buildCorrectionMastery(
  data: CorrectionMasteryData,
): CorrectionMasterySummary {
  const conversationById = new Map(
    data.conversations.map((conversation) => [conversation.id, conversation]),
  );

  const orderedConversationIds = data.conversations.map((conversation) => conversation.id);
  const conversationIndex = new Map(
    orderedConversationIds.map((conversationId, index) => [conversationId, index]),
  );

  const working = data.corrections
    .map((correction): WorkingCorrection | null => {
      const conversation = conversationById.get(correction.conversation_id);
      if (!conversation) return null;

      const targetPhrase = correctionTarget(correction);
      const normalizedTarget = normalizePhrase(targetPhrase);
      if (!normalizedTarget) return null;

      return {
        correction,
        conversation,
        targetPhrase,
        normalizedTarget,
      };
    })
    .filter((item): item is WorkingCorrection => Boolean(item))
    .sort(
      (a, b) =>
        Date.parse(b.correction.created_at) - Date.parse(a.correction.created_at),
    );

  const groups: WorkingGroup[] = [];

  for (const item of working) {
    const existing = groups.find((group) =>
      areSimilarTargets(group.representative.normalizedTarget, item.normalizedTarget),
    );

    if (existing) {
      existing.items.push(item);
      continue;
    }

    groups.push({ representative: item, items: [item] });
  }

  const patterns = groups
    .map((group): CorrectionMasteryPattern | null => {
      const representative = group.representative;
      const learningPath = asApiLearningPath(representative.conversation.learning_path);
      const scenario = getScenario(representative.conversation.scenario_id as ScenarioId);
      if (!learningPath || !scenario) return null;

      const distinctSessionIds = [...new Set(group.items.map((item) => item.conversation.id))];
      const sessionCount = distinctSessionIds.length;
      const lastSeenIndex = Math.min(
        ...distinctSessionIds.map(
          (conversationId) => conversationIndex.get(conversationId) ?? Number.MAX_SAFE_INTEGER,
        ),
      );
      const sessionsSinceLastSeen = Number.isFinite(lastSeenIndex)
        ? lastSeenIndex
        : 0;

      const dates = group.items
        .map((item) => Date.parse(item.correction.created_at))
        .filter(Number.isFinite);

      const firstSeenAt = new Date(Math.min(...dates)).toISOString();
      const lastSeenAt = new Date(Math.max(...dates)).toISOString();
      const status = buildStatus(sessionCount, sessionsSinceLastSeen);
      const latest = group.items[0]!.correction;
      const originalPhrase = cleanPhrase(latest.original) || null;
      const explanation = cleanPhrase(latest.explanation) || null;
      const targetPhrase = representative.targetPhrase;

      return {
        id: representative.normalizedTarget,
        status,
        targetPhrase,
        originalPhrase:
          originalPhrase && normalizePhrase(originalPhrase) !== representative.normalizedTarget
            ? originalPhrase
            : null,
        explanation,
        occurrenceCount: group.items.length,
        sessionCount,
        sessionsSinceLastSeen,
        firstSeenAt,
        lastSeenAt,
        scenarioId: scenario.id,
        scenarioTitle: scenario.title,
        learningPath,
        focus: explanation || `Make “${targetPhrase}” feel automatic instead of corrected.`,
        mission: missionFor(targetPhrase, explanation),
        evidence: evidenceFor(status, sessionCount, sessionsSinceLastSeen),
      };
    })
    .filter((pattern): pattern is CorrectionMasteryPattern => Boolean(pattern))
    .sort((a, b) => {
      const byStatus = statusWeight(a.status) - statusWeight(b.status);
      if (byStatus !== 0) return byStatus;

      if (b.sessionCount !== a.sessionCount) return b.sessionCount - a.sessionCount;
      return Date.parse(b.lastSeenAt) - Date.parse(a.lastSeenAt);
    });

  const recurringCount = patterns.filter((pattern) => pattern.status === 'recurring').length;
  const improvingCount = patterns.filter((pattern) => pattern.status === 'improving').length;
  const masteredCount = patterns.filter((pattern) => pattern.status === 'mastered').length;
  const newCount = patterns.filter((pattern) => pattern.status === 'new').length;

  let headline = 'Your mastery list is starting';
  let summary =
    'Keep practicing. Voxa will separate one-off corrections from patterns as more sessions build up.';

  if (recurringCount > 0) {
    headline = recurringCount === 1 ? 'One pattern needs another rep' : `${recurringCount} patterns need another rep`;
    summary =
      'These corrections have resurfaced across multiple sessions, so Voxa is keeping them in active practice.';
  } else if (improvingCount > 0) {
    headline = 'Old corrections are getting quieter';
    summary =
      'Some recurring corrections have stopped resurfacing recently. Keep using them naturally before Voxa marks them mastered.';
  } else if (masteredCount > 0) {
    headline = 'Some corrections are staying gone';
    summary =
      'These patterns were recurring before, then stayed absent across several later completed sessions.';
  }

  return {
    patterns,
    recurringCount,
    improvingCount,
    masteredCount,
    newCount,
    headline,
    summary,
  };
}
