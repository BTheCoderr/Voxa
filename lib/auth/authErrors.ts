import type { AuthError } from '@supabase/supabase-js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return 'Enter your email address.';
  if (!EMAIL_RE.test(trimmed)) return 'That email address doesn’t look valid.';
  return null;
}

/** Supabase minimum is typically 6 characters. */
export function validatePassword(password: string, forSignUp: boolean): string | null {
  if (!password) return 'Enter your password.';
  if (forSignUp && password.length < 6) return 'Use at least 6 characters for your password.';
  return null;
}

export function formatAuthError(error: AuthError, mode: 'sign_in' | 'sign_up'): string {
  const code = error.code ?? '';
  const msg = error.message.toLowerCase();

  if (code === 'invalid_credentials' || msg.includes('invalid login credentials')) {
    return 'Incorrect email or password. Try again or create an account.';
  }

  if (
    code === 'user_already_exists' ||
    code === 'user_already_registered' ||
    msg.includes('user already registered')
  ) {
    return 'An account with this email already exists. Sign in instead.';
  }

  if (code === 'weak_password' || msg.includes('password') && msg.includes('weak')) {
    return 'Choose a stronger password (at least 6 characters).';
  }

  if (code === 'invalid_email' || msg.includes('invalid email')) {
    return 'That email address doesn’t look valid.';
  }

  if (code === 'email_not_confirmed' || msg.includes('email not confirmed')) {
    return 'Confirm your email first, or turn off email confirmation in Supabase for beta testing.';
  }

  if (code === 'signup_disabled') {
    return 'Sign up is disabled for this project. Ask the builder to enable it in Supabase.';
  }

  if (mode === 'sign_up' && msg.includes('already')) {
    return 'An account with this email already exists. Sign in instead.';
  }

  return error.message || (mode === 'sign_up' ? 'Could not create account.' : 'Could not sign in.');
}
