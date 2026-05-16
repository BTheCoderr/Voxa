export type ScenarioId =
  | 'job_interview'
  | 'business_meeting'
  | 'networking'
  | 'small_talk'
  | 'airport'
  | 'restaurant'
  | 'customer_support'
  | 'travel'
  | 'dating';

export type LaunchLanguage = 'english_business' | 'spanish' | 'mandarin';

export type Scenario = {
  id: ScenarioId;
  title: string;
  subtitle: string;
  durationMin: number;
  /** Languages this scenario is tuned for at launch */
  languages: LaunchLanguage[];
};

export const LAUNCH_LANGUAGES: { id: LaunchLanguage; label: string; hint: string }[] = [
  { id: 'english_business', label: 'Business English', hint: 'Meetings, interviews, email tone' },
  { id: 'spanish', label: 'Conversational Spanish', hint: 'Natural pace, everyday confidence' },
  { id: 'mandarin', label: 'Conversational Mandarin', hint: 'Pinyin-friendly speaking practice' },
];

export const SCENARIOS: Scenario[] = [
  {
    id: 'job_interview',
    title: 'Job interview',
    subtitle: 'Answer clearly, stay composed, steer the narrative.',
    durationMin: 6,
    languages: ['english_business', 'spanish', 'mandarin'],
  },
  {
    id: 'business_meeting',
    title: 'Business meeting',
    subtitle: 'Agree, disagree politely, and keep momentum.',
    durationMin: 7,
    languages: ['english_business', 'spanish', 'mandarin'],
  },
  {
    id: 'networking',
    title: 'Networking',
    subtitle: 'Warm intros, smooth follow-ups, graceful exits.',
    durationMin: 5,
    languages: ['english_business', 'spanish', 'mandarin'],
  },
  {
    id: 'small_talk',
    title: 'Small talk',
    subtitle: 'Light, kind chat that builds rapport.',
    durationMin: 4,
    languages: ['english_business', 'spanish', 'mandarin'],
  },
  {
    id: 'airport',
    title: 'Airport',
    subtitle: 'Check-in, security, gates — fewer panicked pauses.',
    durationMin: 5,
    languages: ['english_business', 'spanish', 'mandarin'],
  },
  {
    id: 'restaurant',
    title: 'Restaurant',
    subtitle: 'Orders, allergies, and splitting the bill calmly.',
    durationMin: 5,
    languages: ['english_business', 'spanish', 'mandarin'],
  },
  {
    id: 'customer_support',
    title: 'Customer support',
    subtitle: 'De-escalate, clarify, and fix with empathy.',
    durationMin: 6,
    languages: ['english_business', 'spanish', 'mandarin'],
  },
  {
    id: 'travel',
    title: 'Travel conversations',
    subtitle: 'Hotels, directions, and polite asks on the road.',
    durationMin: 5,
    languages: ['english_business', 'spanish', 'mandarin'],
  },
  {
    id: 'dating',
    title: 'Dating conversations',
    subtitle: 'Playful, respectful chemistry without the cringe.',
    durationMin: 6,
    languages: ['english_business', 'spanish', 'mandarin'],
  },
];

export function getScenario(id: ScenarioId): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
