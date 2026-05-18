import { parseAuthParamsFromUrl } from '@/lib/auth/parseAuthUrl';
import { supabase } from '@/lib/supabase/client';

function formatOAuthError(code: string, description?: string): string {
  const d = description?.replace(/\+/g, ' ');
  if (code === 'access_denied') return 'Sign-in was cancelled.';
  if (d) return d.length > 180 ? `${d.slice(0, 177)}…` : d;
  return 'Sign-in failed. Please try again.';
}

export type CompleteSessionResult = { ok: true } | { ok: false; message: string };

/**
 * Establishes a Supabase session from the deep link URL opened after the user taps the magic link.
 */
export async function completeSessionFromUrl(url: string): Promise<CompleteSessionResult> {
  const params = parseAuthParamsFromUrl(url);

  const errCode = params.error;
  if (errCode) {
    return { ok: false, message: formatOAuthError(errCode, params.error_description) };
  }

  const access = params.access_token;
  const refresh = params.refresh_token;
  if (access && refresh) {
    const { error } = await supabase.auth.setSession({
      access_token: access,
      refresh_token: refresh,
    });
    if (error) {
      return {
        ok: false,
        message:
          error.message.includes('expired') || error.message.includes('invalid')
            ? 'This sign-in link has expired. Request a new magic link from the sign-in screen.'
            : error.message,
      };
    }
    return { ok: true };
  }

  const code = params.code;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return {
        ok: false,
        message:
          error.message.includes('expired') || error.message.includes('invalid')
            ? 'This sign-in link has expired. Request a new magic link.'
            : error.message,
      };
    }
    return { ok: true };
  }

  return {
    ok: false,
    message: 'This link is missing sign-in data or has expired. Please request a new magic link.',
  };
}
