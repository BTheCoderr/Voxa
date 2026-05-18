import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

/** Matches `expo.scheme` in app.json (fallback if config not loaded). */
const DEFAULT_SCHEME = 'voxa';

function resolveAppScheme(): string {
  const raw = Constants.expoConfig?.scheme;
  if (typeof raw === 'string' && raw.length > 0) return raw;
  if (Array.isArray(raw) && typeof raw[0] === 'string' && raw[0].length > 0) return raw[0];
  return DEFAULT_SCHEME;
}

/**
 * Canonical deep link for Expo Router route `app/auth/callback`.
 * Always use **two slashes** after the scheme (`voxa://auth/callback`) so it matches iOS expectations
 * and Supabase "Redirect URLs" entries exactly.
 *
 * Supabase: if `emailRedirectTo` is **not** in the allow list, GoTrue may fall back to **Site URL**
 * (e.g. `https://voxxa.netlify.app`) — which opens the marketing site instead of the app.
 */
export function getAuthMagicLinkRedirectUrl(): string {
  if (Platform.OS === 'web') {
    const configured = process.env.EXPO_PUBLIC_AUTH_WEB_REDIRECT_URL?.trim();
    if (configured) return configured;
    if (typeof window !== 'undefined' && window.location?.origin) {
      return `${window.location.origin}/auth/callback`;
    }
    return `${resolveAppScheme()}://auth/callback`;
  }

  const envOverride = process.env.EXPO_PUBLIC_AUTH_REDIRECT_NATIVE?.trim();
  if (envOverride) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[auth] emailRedirectTo (EXPO_PUBLIC_AUTH_REDIRECT_NATIVE)', envOverride);
    }
    return envOverride;
  }

  const scheme = resolveAppScheme();

  const generated = Linking.createURL('auth/callback', { scheme });
  const canonical = `${scheme}://auth/callback`;

  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log('[auth] emailRedirectTo Linking.createURL →', generated);
    // eslint-disable-next-line no-console
    console.log('[auth] emailRedirectTo canonical (sent to Supabase) →', canonical);
  }

  /**
   * Prefer canonical `scheme://auth/callback`:
   * - `createURL` can yield `voxa:/auth/callback` (single slash) depending on host URI; Supabase allow-list
   *   often expects `voxa://auth/callback`. Mismatch → redirect can fall back to Site URL (Netlify).
   */
  return canonical;
}
