import type PostHog from 'posthog-react-native';

let analyticsClient: PostHog | null = null;

export function setAnalyticsPosthog(client: PostHog | null): void {
  analyticsClient = client;
}

export function getAnalyticsPosthog(): PostHog | null {
  return analyticsClient;
}
