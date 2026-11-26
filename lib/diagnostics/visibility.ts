/**
 * Whether the tester-facing Diagnostics screen is available in this build.
 *
 * Fails closed: App Store builds (EAS channel `production`) and builds with no update
 * channel hide it unless EXPO_PUBLIC_SHOW_DIAGNOSTICS=1 is set for that build. The screen
 * exposes provider configuration and a TTS test button that spends provider credits.
 */
export function diagnosticsEnabled(input: {
  isDev: boolean;
  channel: string | null | undefined;
  override?: string | null;
}): boolean {
  if (input.isDev) return true;
  if (input.override?.trim() === '1') return true;
  const channel = input.channel?.trim();
  return Boolean(channel) && channel !== 'production';
}
