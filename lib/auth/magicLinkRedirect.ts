import * as Linking from 'expo-linking';

/**
 * Must match the `app/auth/callback` route and Supabase Auth → Redirect URLs allow list.
 */
export function getAuthMagicLinkRedirectUrl(): string {
  return Linking.createURL('auth/callback');
}
