import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LaunchLanguage } from '@/constants/scenarios';

const LANGUAGE_KEY = '@voxa/preferences/v1/language';
const GOAL_KEY = '@voxa/preferences/v1/goal';

export type LearningGoal = 'speaking_confidence' | 'work_english' | 'travel' | 'interviews';

const VALID_LANGUAGES = new Set<LaunchLanguage>(['english_business', 'spanish', 'mandarin']);

export async function getPreferredLanguage(): Promise<LaunchLanguage | null> {
  const v = await AsyncStorage.getItem(LANGUAGE_KEY);
  if (!v || !VALID_LANGUAGES.has(v as LaunchLanguage)) return null;
  return v as LaunchLanguage;
}

export async function setPreferredLanguage(lang: LaunchLanguage): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
}

export async function getLearningGoal(): Promise<LearningGoal | null> {
  const v = await AsyncStorage.getItem(GOAL_KEY);
  if (!v) return null;
  return v as LearningGoal;
}

export async function setLearningGoal(goal: LearningGoal): Promise<void> {
  await AsyncStorage.setItem(GOAL_KEY, goal);
}
