import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase/client';

type DeleteAccountErrorBody = { error?: string; code?: string };

/**
 * Permanently deletes the signed-in user via the `delete-account` Edge Function.
 */
export async function deleteAccountViaEdgeFunction(accessToken: string): Promise<void> {
  if (!env.deleteAccountUrl) {
    throw new Error(
      'Account deletion is not configured. Set EXPO_PUBLIC_DELETE_ACCOUNT_URL to your delete-account function URL.',
    );
  }

  if (!accessToken?.trim()) {
    throw new Error('Sign in is required to delete your account.');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };
  if (env.supabaseAnonKey) {
    headers.apikey = env.supabaseAnonKey;
  }

  const res = await fetch(env.deleteAccountUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({}),
  });

  const raw = await res.text();
  let json: DeleteAccountErrorBody | undefined;
  try {
    json = raw ? (JSON.parse(raw) as DeleteAccountErrorBody) : undefined;
  } catch {
    json = undefined;
  }

  if (!res.ok) {
    const msg = typeof json?.error === 'string' ? json.error : 'Could not delete your account. Try again.';
    if (res.status === 401 || res.status === 403) {
      throw new Error('Please sign in again, then try deleting your account.');
    }
    throw new Error(msg);
  }
}

/** Resolves a fresh access token for account deletion. */
export async function resolveAccessTokenForDeletion(fallbackToken?: string): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const fresh = data.session?.access_token?.trim();
  if (fresh) return fresh;
  return fallbackToken?.trim() ?? '';
}
