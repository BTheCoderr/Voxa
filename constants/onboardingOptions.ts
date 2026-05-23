import type {
  ExplanationLanguage,
  Interest,
  LearnerLevel,
  NativeLanguage,
} from '@/lib/learning/types';
import type { LaunchLanguage } from '@/constants/scenarios';
import { LAUNCH_LANGUAGES } from '@/constants/scenarios';

export const NATIVE_LANGUAGE_OPTIONS: { id: NativeLanguage; label: string }[] = [
  { id: 'english', label: 'English' },
  { id: 'spanish', label: 'Spanish' },
  { id: 'mandarin', label: 'Mandarin' },
  { id: 'french', label: 'French' },
  { id: 'german', label: 'German' },
  { id: 'portuguese', label: 'Portuguese' },
  { id: 'other', label: 'Other' },
];

export const TARGET_LANGUAGE_OPTIONS: { id: LaunchLanguage; label: string; hint: string }[] =
  LAUNCH_LANGUAGES;

export const INTEREST_OPTIONS: { id: Interest; label: string; emoji: string }[] = [
  { id: 'travel', label: 'Travel', emoji: '✈️' },
  { id: 'work', label: 'Work & career', emoji: '💼' },
  { id: 'culture', label: 'Culture', emoji: '🎭' },
  { id: 'food', label: 'Food & dining', emoji: '🍽️' },
  { id: 'social', label: 'Social life', emoji: '💬' },
  { id: 'study', label: 'Study & exams', emoji: '📚' },
];

export const LEVEL_OPTIONS: { id: LearnerLevel; label: string; hint: string }[] = [
  { id: 'beginner', label: 'Beginner', hint: 'New to the language — building foundations' },
  { id: 'intermediate', label: 'Intermediate', hint: 'Comfortable basics — ready for real conversations' },
  { id: 'advanced', label: 'Advanced', hint: 'Fluent-ish — polishing nuance and confidence' },
];

export const EXPLANATION_LANGUAGE_OPTIONS: {
  id: ExplanationLanguage;
  label: string;
  hint: string;
}[] = [
  { id: 'english', label: 'English', hint: 'Explanations and hints in English' },
  { id: 'native', label: 'My native language', hint: 'Use the language you speak best' },
  { id: 'target', label: 'Target language', hint: 'Full immersion — explanations in your learning language' },
];

export const GUIDED_ONBOARDING_STEP_COUNT = 7;
