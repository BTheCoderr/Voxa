/**
 * Local (on-device) Voxa data cleanup used after permanent account deletion.
 * Pure helpers stay free of React Native imports so they can be unit tested.
 */

export const VOXA_STORAGE_PREFIX = '@voxa/';

/** Kept so the person is not sent back through onboarding mid-session. */
export const PRESERVED_KEYS_ON_ACCOUNT_DELETE: ReadonlySet<string> = new Set([
  '@voxa/onboarding/v1/complete',
]);

/** Voxa-owned keys to remove after an account is deleted (progress, plans, preferences, nudges). */
export function keysToClearOnAccountDelete(allKeys: readonly string[]): string[] {
  return allKeys.filter(
    (key) => key.startsWith(VOXA_STORAGE_PREFIX) && !PRESERVED_KEYS_ON_ACCOUNT_DELETE.has(key),
  );
}
