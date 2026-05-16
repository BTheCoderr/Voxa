import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

import { env } from '@/lib/env';

let configured = false;

export function configureRevenueCat(): void {
  if (Platform.OS === 'web') return;
  if (configured) return;

  const apiKey =
    Platform.OS === 'ios'
      ? env.revenueCatIos
      : Platform.OS === 'android'
        ? env.revenueCatAndroid
        : '';

  if (!apiKey) {
    return;
  }

  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);
  Purchases.configure({ apiKey });
  configured = true;
}

export async function logInRevenueCat(appUserId: string): Promise<void> {
  if (Platform.OS === 'web' || !appUserId) return;
  try {
    await Purchases.logIn(appUserId);
  } catch {
    // Wiring happens once backend user ids are stable
  }
}

export async function logOutRevenueCat(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Purchases.logOut();
  } catch {
    // noop
  }
}
