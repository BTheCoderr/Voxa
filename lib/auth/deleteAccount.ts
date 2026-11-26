import AsyncStorage from '@react-native-async-storage/async-storage';

import { getAnalyticsPosthog } from '@/lib/analytics/clientRef';
import { keysToClearOnAccountDelete } from '@/lib/auth/localAccountData';
import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase/client';

/**
 * Permanently deletes the signed-in Voxa account through the protected
 * `delete-account` Supabase Edge Function (supabase/functions/delete-account).
 * The server deletes user-owned rows and the auth user; this client then clears
 * the local session and on-device practice data.
 */
export async function deleteCurrentAccount(): Promise<void> {
  if (!env.supabaseConfigured || !env.deleteAccountUrl) {
    throw new Error('Account deletion is not configured for this build.');
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) throw sessionError;
  if (!session?.access_token) {
    throw new Error('You need to be signed in to delete your account.');
  }

  let response: Response;
  try {
    response = await fetch(env.deleteAccountUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: env.supabaseAnonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ confirmation: 'DELETE' }),
    });
  } catch {
    throw new Error('Could not reach Voxa. Check your connection and try again.');
  }

  if (!response.ok) {
    let message = 'We could not delete your account. Please try again.';
    try {
      const payload = (await response.json()) as { error?: string; message?: string };
      message = payload.error ?? payload.message ?? message;
    } catch {
      // Keep the safe fallback message when the server returns no JSON body.
    }
    throw new Error(message);
  }

  // The account is gone server-side; local cleanup below is best-effort and must not
  // surface as a deletion failure. RevenueCat logout follows the session change in AuthContext.
  await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
  await clearLocalAccountData();
}

async function clearLocalAccountData(): Promise<void> {
  try {
    const keys = keysToClearOnAccountDelete(await AsyncStorage.getAllKeys());
    if (keys.length > 0) await AsyncStorage.multiRemove(keys);
  } catch {
    // Ignore storage failures; the server-side deletion already succeeded.
  }
  try {
    getAnalyticsPosthog()?.reset();
  } catch {
    // Analytics are optional.
  }
}
