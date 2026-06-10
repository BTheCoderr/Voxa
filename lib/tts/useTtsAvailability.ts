import { useEffect, useState } from 'react';

import { env } from '@/lib/env';
import { fetchTtsHealth, isTtsPlaybackAvailable } from '@/lib/tts/elevenLabsTts';

/** Polls TTS health once; returns null while loading, false when unavailable. */
export function useTtsAvailability(authToken?: string): boolean | null {
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (!env.elevenLabsTtsConfigured) {
      setAvailable(false);
      return;
    }

    let cancelled = false;
    void fetchTtsHealth(authToken).then((health) => {
      if (!cancelled) {
        setAvailable(isTtsPlaybackAvailable(health));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [authToken]);

  return available;
}
