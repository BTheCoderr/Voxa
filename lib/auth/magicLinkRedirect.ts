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
 * `Linking.createURL` can return `voxa:/auth/callback` (one slash). Supabase allow-list and iOS
 * expect `voxa://auth/callback`. Mismatch → GoTrue may fall back to **Site URL** (Netlify).
 */
function normalizeCustomSchemeRedirect(url: string, scheme: string): string {
  const double = `${scheme}://`;
  const single = `${scheme}:/`;
  if (url.startsWith(double)) return url;
  if (url.startsWith(single)) return double + url.slice(single.length);
  return url;
}

/**
 * Must match `app/auth/callback` and Supabase **Authentication → Redirect URLs**.
 *
 * **Always starts from `Linking.createURL('auth/callback')`** (per Expo linking contract), then
 * normalizes custom-scheme slashes so Supabase receives `voxa://auth/callback`, not `voxa:/…`.
 *
 * If `voxa://auth/callback` is missing from Redirect URLs, or the **email template** does not use
 * `{{ .ConfirmationURL }}`, users may still land on **Site URL** (`https://voxxa.netlify.app/...`).
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
  const fromExpo = Linking.createURL('auth/callback', { scheme });
  const redirectTo = ['http', 'https', 'exp'].some((p) => fromExpo.startsWith(`${p}://`))
    ? fromExpo
    : normalizeCustomSchemeRedirect(fromExpo, scheme);

  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log('[auth] emailRedirectTo Linking.createURL (raw) →', fromExpo);
    // eslint-disable-next-line no-console
    console.log('[auth] emailRedirectTo (sent to Supabase signInWithOtp) →', redirectTo);
  }

  return redirectTo;
}
