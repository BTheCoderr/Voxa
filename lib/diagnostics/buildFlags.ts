import * as Updates from 'expo-updates';

import { diagnosticsEnabled } from '@/lib/diagnostics/visibility';

export function isDiagnosticsEnabled(): boolean {
  return diagnosticsEnabled({
    isDev: __DEV__,
    channel: Updates.channel,
    override: process.env.EXPO_PUBLIC_SHOW_DIAGNOSTICS,
  });
}
