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
export type ScenarioDifficulty = 'Starter' | 'Intermediate' | 'Challenge';

export type Scenario = {
  id: ScenarioId;
  title: string;
  subtitle: string;
  durationMin: number;
  focus: string;
  mission: string;
  difficulty: ScenarioDifficulty;
  /** Languages this scenario is tuned for at launch */
  languages: LaunchLanguage[];
};

export const LAUNCH_LANGUAGES: { id: LaunchLanguage; label: string; hint: string }[] = [
  { id: 'english_business', label: 'Business English', hint: 'Meetings, interviews, professional tone' },
  { id: 'spanish', label: 'Spanish', hint: 'Natural conversational Spanish' },
  { id: 'mandarin', label: 'Mandarin', hint: 'Mandarin with pinyin when helpful' },
];

export const SCENARIOS: Scenario[] = [
  {
    id: 'job_interview',
    title: 'Job interview',
    subtitle: 'Answer clearly, stay composed, steer the narrative.',
    durationMin: 6,
    focus: 'Clear answers',
    mission: 'Practice a concise introduction, one accomplishment story, and one confident follow-up answer.',
    difficulty: 'Challenge',
    languages: ['english_business', 'spanish', 'mandarin'],
  },
  {
    id: 'business_meeting',
    title: 'Business meeting',
    subtitle: 'Agree, disagree politely, and keep momentum.',
    durationMin: 7,
    focus: 'Professional tone',
    mission: 'Make one point, disagree once without sounding harsh, and close with a clear next step.',
    difficulty: 'Challenge',
    languages: ['english_business', 'spanish', 'mandarin'],
  },
  {
    id: 'networking',
    title: 'Networking',
    subtitle: 'Warm intros, smooth follow-ups, graceful exits.',
    durationMin: 5,
    focus: 'Conversation flow',
    mission: 'Open naturally, ask two useful follow-ups, and exit the conversation without an awkward stop.',
    difficulty: 'Intermediate',
    languages: ['english_business', 'spanish', 'mandarin'],
  },
  {
    id: 'small_talk',
    title: 'Small talk',
    subtitle: 'Light, kind chat that builds rapport.',
    durationMin: 4,
    focus: 'Natural rhythm',
    mission: 'Keep a casual conversation moving for a few turns without overthinking every sentence.',
    difficulty: 'Starter',
    languages: ['english_business', 'spanish', 'mandarin'],
  },
  {
    id: 'airport',
    title: 'Airport',
    subtitle: 'Check-in, security, gates — fewer panicked pauses.',
    durationMin: 5,
    focus: 'Quick responses',
    mission: 'Handle a check-in problem, ask for clarification, and confirm the next step under light pressure.',
    difficulty: 'Intermediate',
    languages: ['english_business', 'spanish', 'mandarin'],
  },
  {
    id: 'restaurant',
    title: 'Restaurant',
    subtitle: 'Orders, allergies, and splitting the bill calmly.',
    durationMin: 5,
    focus: 'Everyday confidence',
    mission: 'Order, make one change politely, and handle a follow-up question without switching out of the conversation.',
    difficulty: 'Starter',
    languages: ['english_business', 'spanish', 'mandarin'],
  },
  {
    id: 'customer_support',
    title: 'Customer support',
    subtitle: 'De-escalate, clarify, and fix with empathy.',
    durationMin: 6,
    focus: 'Calm under pressure',
    mission: 'Clarify the problem, acknowledge frustration, and explain a solution in a calm, structured way.',
    difficulty: 'Challenge',
    languages: ['english_business', 'spanish', 'mandarin'],
  },
  {
    id: 'travel',
    title: 'Travel conversations',
    subtitle: 'Hotels, directions, and polite asks on the road.',
    durationMin: 5,
    focus: 'Useful phrases',
    mission: 'Ask for help, clarify one detail, and repeat back information so you know you understood it.',
    difficulty: 'Starter',
    languages: ['english_business', 'spanish', 'mandarin'],
  },
  {
    id: 'dating',
    title: 'Dating conversations',
    subtitle: 'Playful, respectful chemistry without the cringe.',
    durationMin: 6,
    focus: 'Tone & spontaneity',
    mission: 'Keep the exchange light, ask a real follow-up, and respond naturally instead of rehearsing the “perfect” line.',
    difficulty: 'Intermediate',
    languages: ['english_business', 'spanish', 'mandarin'],
  },
];

export function getScenario(id: ScenarioId): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
