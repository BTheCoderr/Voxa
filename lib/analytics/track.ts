import type { JsonType } from '@posthog/core';

import { getAnalyticsPosthog } from '@/lib/analytics/clientRef';

/** Fires when PostHog is configured; no-op otherwise. */
export function trackEvent(name: string, properties?: Record<string, JsonType>): void {
  try {
    const client = getAnalyticsPosthog();
    if (!client) return;
    client.capture(name, properties);
  } catch {
    /* ignore analytics failures */
  }
}
