import PostHog, { PostHogProvider } from 'posthog-react-native';
import { useLayoutEffect, useMemo } from 'react';

import { setAnalyticsPosthog } from '@/lib/analytics/clientRef';
import { env } from '@/lib/env';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const client = useMemo(() => {
    if (!env.posthogKey) return null;
    return new PostHog(env.posthogKey, {
      host: env.posthogHost,
    });
  }, []);

  useLayoutEffect(() => {
    setAnalyticsPosthog(client);
    return () => {
      setAnalyticsPosthog(null);
    };
  }, [client]);

  if (!client) {
    return <>{children}</>;
  }

  return (
    <PostHogProvider client={client} autocapture>
      {children}
    </PostHogProvider>
  );
}
