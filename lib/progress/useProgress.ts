import { useCallback, useEffect, useState } from 'react';

import { trackEvent } from '@/lib/analytics/track';
import { useAuth } from '@/lib/auth/AuthContext';
import { getUserProgress, recordStreakEvent, updateXp } from '@/lib/db/progress';
import { env } from '@/lib/env';
import {
  type LocalProgressSnapshot,
  loadLocalProgress,
  recordSessionCompleted,
  writeLocalProgressMirror,
} from '@/lib/progress/storage';
import { supabase } from '@/lib/supabase/client';

export function useProgress(): {
  progress: LocalProgressSnapshot | null;
  progressHydrated: boolean;
  refresh: () => Promise<void>;
  addXpFromSession: (
    xp: number,
    opts?: { conversationId?: string; source?: string },
  ) => Promise<void>;
} {
  const { user } = useAuth();
  const [progress, setProgress] = useState<LocalProgressSnapshot | null>(null);
  const [progressHydrated, setProgressHydrated] = useState(false);

  const refresh = useCallback(async () => {
    try {
      if (env.supabaseConfigured && user?.id) {
        try {
          const remote = await getUserProgress(supabase, user.id);
          if (remote) {
            const snap: LocalProgressSnapshot = {
              xp: remote.total_xp,
              streak: remote.current_streak,
              lastDay: remote.last_activity_date,
            };
            setProgress(snap);
            await writeLocalProgressMirror(snap);
            return;
          }
        } catch {
          /* fall through */
        }
      }
      setProgress(await loadLocalProgress());
    } finally {
      setProgressHydrated(true);
    }
  }, [user?.id]);

  useEffect(() => {
    setProgressHydrated(false);
  }, [user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addXpFromSession = useCallback(
    async (xp: number, opts?: { conversationId?: string; source?: string }) => {
      if (xp <= 0) return;

      if (env.supabaseConfigured && user?.id) {
        await updateXp(supabase, user.id, xp);
        await recordStreakEvent(supabase, user.id, { conversationId: opts?.conversationId ?? null });
        const remote = await getUserProgress(supabase, user.id);
        if (remote) {
          const snap: LocalProgressSnapshot = {
            xp: remote.total_xp,
            streak: remote.current_streak,
            lastDay: remote.last_activity_date,
          };
          setProgress(snap);
          await writeLocalProgressMirror(snap);
        }
        trackEvent('xp_earned', {
          amount: xp,
          source: opts?.source ?? 'voice_session',
          conversation_id: opts?.conversationId ?? null,
          sync: 'supabase',
        });
        return;
      }

      const next = await recordSessionCompleted(xp);
      setProgress(next);
      trackEvent('xp_earned', {
        amount: xp,
        source: opts?.source ?? 'voice_session',
        conversation_id: opts?.conversationId ?? null,
        sync: 'local',
      });
    },
    [user?.id],
  );

  return { progress, progressHydrated, refresh, addXpFromSession };
}
