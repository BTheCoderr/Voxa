import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = '@voxa/onboarding/v1/complete';

export async function getOnboardingComplete(): Promise<boolean> {
  const v = await AsyncStorage.getItem(ONBOARDING_KEY);
  return v === 'true';
}

export async function setOnboardingComplete(value: boolean): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_KEY, value ? 'true' : 'false');
}
