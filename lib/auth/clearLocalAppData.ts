import AsyncStorage from '@react-native-async-storage/async-storage';

const PROGRESS_KEYS = [
  '@voxa/progress/v1/xp',
  '@voxa/progress/v1/streak',
  '@voxa/progress/v1/last_yyyy_mm_dd',
] as const;

const PREFERENCE_KEYS = ['@voxa/preferences/v1/language', '@voxa/preferences/v1/goal'] as const;

/** Clears on-device practice state after account deletion or explicit reset. */
export async function clearLocalAppData(): Promise<void> {
  await AsyncStorage.multiRemove([
    '@voxa/onboarding/v1/complete',
    '@voxa/guided-profile/v1',
    '@voxa/guided-profile/v1/legacy-migrated',
    '@voxa/lessons/v1/completed',
    ...PROGRESS_KEYS,
    ...PREFERENCE_KEYS,
  ]);
}
