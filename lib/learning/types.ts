import type { LaunchLanguage } from '@/constants/scenarios';

export type LearningLanguage = LaunchLanguage;

export type NativeLanguage =
  | 'english'
  | 'spanish'
  | 'mandarin'
  | 'french'
  | 'german'
  | 'portuguese'
  | 'other';

export type LearnerLevel = 'beginner' | 'intermediate' | 'advanced';

export type Interest =
  | 'travel'
  | 'work'
  | 'culture'
  | 'food'
  | 'social'
  | 'study';

export type ExplanationLanguage = 'english' | 'native' | 'target';

export type LessonMode = 'lecture' | 'practice';

export type LessonNode = {
  id: string;
  title: string;
  subtitle: string;
  order: number;
  /** Maps to existing scenario engine for practice */
  scenarioId: string;
  lecture: {
    id: string;
    text: string;
  }[];
};

export type GuidedProfile = {
  displayName: string;
  nativeLanguage: NativeLanguage | null;
  targetLanguage: LearningLanguage | null;
  interests: Interest[];
  level: LearnerLevel | null;
  explanationLanguage: ExplanationLanguage | null;
  onboardingCompleted: boolean;
};

export const EMPTY_GUIDED_PROFILE: GuidedProfile = {
  displayName: '',
  nativeLanguage: null,
  targetLanguage: null,
  interests: [],
  level: null,
  explanationLanguage: null,
  onboardingCompleted: false,
};
