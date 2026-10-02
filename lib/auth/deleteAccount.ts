import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase/client';

/**
 * Permanently deletes the signed-in Voxa account through the protected
 * Supabase Edge Function. The server remains responsible for deleting
 * auth data and any user-owned rows that are not removed by cascades.
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

  const response = await fetch(env.deleteAccountUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: env.supabaseAnonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ confirmation: 'DELETE' }),
  });

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

  // Clear any persisted client session even if deleting the auth user already
  // invalidated the token server-side.
  await supabase.auth.signOut({ scope: 'local' });
}
