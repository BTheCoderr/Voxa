export const COACH_SKILL_TAGS = [
  'clarity',
  'grammar',
  'vocabulary',
  'fluency',
  'natural_phrasing',
  'professional_tone',
  'response_building',
  'conversation_flow',
  'conciseness',
  'politeness',
] as const;

export type CoachSkillTag = (typeof COACH_SKILL_TAGS)[number];

export const COACH_SKILL_LABELS: Record<CoachSkillTag, string> = {
  clarity: 'Clarity',
  grammar: 'Grammar',
  vocabulary: 'Vocabulary',
  fluency: 'Fluency',
  natural_phrasing: 'Natural phrasing',
  professional_tone: 'Professional tone',
  response_building: 'Response building',
  conversation_flow: 'Conversation flow',
  conciseness: 'Conciseness',
  politeness: 'Politeness',
};

export function isCoachSkillTag(value: unknown): value is CoachSkillTag {
  return typeof value === 'string' && COACH_SKILL_TAGS.includes(value as CoachSkillTag);
}

export function coachSkillLabel(tag: CoachSkillTag): string {
  return COACH_SKILL_LABELS[tag];
}
