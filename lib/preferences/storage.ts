import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LaunchLanguage } from '@/constants/scenarios';
import type { UserLevel } from '@/lib/realtime/types';

const LANGUAGE_KEY = '@voxa/preferences/v1/language';
const GOAL_KEY = '@voxa/preferences/v1/goal';
const LEVELS_KEY = '@voxa/preferences/v1/levels';

export type LearningGoal = 'speaking_confidence' | 'work_english' | 'travel' | 'interviews';

export const DEFAULT_USER_LEVEL: UserLevel = 'intermediate';

const VALID_LANGUAGES = new Set<LaunchLanguage>(['english_business', 'spanish', 'mandarin']);
const VALID_LEVELS = new Set<UserLevel>(['beginner', 'intermediate', 'advanced']);

type StoredPracticeLevels = Partial<Record<LaunchLanguage, UserLevel>>;

export async function getPreferredLanguage(): Promise<LaunchLanguage | null> {
  const v = await AsyncStorage.getItem(LANGUAGE_KEY);
  if (!v || !VALID_LANGUAGES.has(v as LaunchLanguage)) return null;
  return v as LaunchLanguage;
}

export async function setPreferredLanguage(lang: LaunchLanguage): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
}

async function getStoredPracticeLevels(): Promise<StoredPracticeLevels> {
  const raw = await AsyncStorage.getItem(LEVELS_KEY);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const result: StoredPracticeLevels = {};

    for (const language of VALID_LANGUAGES) {
      const level = parsed[language];
      if (typeof level === 'string' && VALID_LEVELS.has(level as UserLevel)) {
        result[language] = level as UserLevel;
      }
    }

    return result;
  } catch {
    return {};
  }
}

export async function getPreferredLevel(language: LaunchLanguage): Promise<UserLevel> {
  const levels = await getStoredPracticeLevels();
  return levels[language] ?? DEFAULT_USER_LEVEL;
}

export async function setPreferredLevel(
  language: LaunchLanguage,
  level: UserLevel,
): Promise<void> {
  if (!VALID_LEVELS.has(level)) {
    throw new Error('Invalid Voxa practice level.');
  }

  const levels = await getStoredPracticeLevels();
  levels[language] = level;
  await AsyncStorage.setItem(LEVELS_KEY, JSON.stringify(levels));
}

export async function getLearningGoal(): Promise<LearningGoal | null> {
  const v = await AsyncStorage.getItem(GOAL_KEY);
  if (!v) return null;
  return v as LearningGoal;
}

export async function setLearningGoal(goal: LearningGoal): Promise<void> {
  await AsyncStorage.setItem(GOAL_KEY, goal);
}
