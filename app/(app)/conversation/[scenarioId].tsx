import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CorrectionChips } from '@/components/conversation/CorrectionChips';
import { LiveTranscriptList } from '@/components/conversation/LiveTranscriptList';
import { VoiceOrb } from '@/components/conversation/VoiceOrb';
import { BetaDisclaimer } from '@/components/ui/BetaDisclaimer';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { VoxaButton } from '@/components/ui/VoxaButton';
import { VoxaText } from '@/components/ui/VoxaText';
import type { Scenario, ScenarioId } from '@/constants/scenarios';
import { getScenario } from '@/constants/scenarios';
import { palette, spacing } from '@/constants/theme';
import { trackEvent } from '@/lib/analytics/track';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  addConversationMessage,
  addCorrection,
  completeConversation,
  createConversation,
} from '@/lib/db/conversations';
import { env } from '@/lib/env';
import { useProgress } from '@/lib/progress/useProgress';
import { toApiLearningPath } from '@/lib/realtime/learningPath';
import type { UseVoxaVoiceSessionParams } from '@/lib/realtime/useVoxaVoiceSession';
import { useVoxaVoiceSession } from '@/lib/realtime/useVoxaVoiceSession';
import type { TranscriptPersistPayload, VoiceSessionPhase } from '@/lib/realtime/voiceSessionTypes';
import { supabase } from '@/lib/supabase/client';

const XP_FOR_SESSION = 28;
const TRANSCRIPT_DEBOUNCE_MS = 380;

function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m <= 0) return `${s}s`;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

function phaseHint(phase: VoiceSessionPhase): string {
  switch (phase) {
    case 'idle':
      return 'Tap Start when you are ready. Find a quiet spot — you’ve got this.';
    case 'requesting_permission':
      return 'We need microphone access for realtime speaking.';
    case 'minting_session':
      return 'Securing a private voice session…';
    case 'connecting':
      return 'Connecting to your practice partner…';
    case 'connected':
      return 'Speak naturally. Small mistakes are part of practice.';
    case 'listening':
      return 'Listening…';
    case 'ai_speaking':
      return 'Voxa is speaking.';
    case 'error':
      return 'Something went wrong. You can try again in a moment.';
    case 'ended':
      return 'Session complete.';
    default:
      return '';
  }
}

type ConversationSessionActiveProps = {
  scenario: Scenario;
  userId: string;
  accessToken: string;
};

function ConversationSessionActive({ scenario, userId, accessToken }: ConversationSessionActiveProps) {
  const insets = useSafeAreaInsets();
  const { addXpFromSession } = useProgress();

  const conversationIdRef = useRef<string | null>(null);
  const messageTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const [sessionStats, setSessionStats] = useState<{
    durationSeconds: number;
    xpEarned: number;
    correctionCount: number;
  } | null>(null);

  useEffect(() => {
    return () => {
      for (const t of messageTimersRef.current.values()) clearTimeout(t);
      messageTimersRef.current.clear();
    };
  }, []);

  const flushPersistMessage = useCallback(
    async (payload: TranscriptPersistPayload) => {
      const cid = conversationIdRef.current;
      if (!cid || !env.supabaseConfigured) return;
      try {
        await addConversationMessage(supabase, {
          conversationId: cid,
          userId,
          role: payload.role,
          body: payload.text,
          clientMessageId: payload.clientMessageId,
          isFinal: !payload.partial,
        });
      } catch (e) {
        console.warn('addConversationMessage', e);
      }
    },
    [userId],
  );

  const onTranscriptPersist = useCallback(
    (payload: TranscriptPersistPayload) => {
      if (!env.supabaseConfigured || !conversationIdRef.current) return;

      if (!payload.partial) {
        const t = messageTimersRef.current.get(payload.clientMessageId);
        if (t) clearTimeout(t);
        messageTimersRef.current.delete(payload.clientMessageId);
        void flushPersistMessage(payload);
        return;
      }

      const prev = messageTimersRef.current.get(payload.clientMessageId);
      if (prev) clearTimeout(prev);

      const timer = setTimeout(() => {
        messageTimersRef.current.delete(payload.clientMessageId);
        void flushPersistMessage(payload);
      }, TRANSCRIPT_DEBOUNCE_MS);

      messageTimersRef.current.set(payload.clientMessageId, timer);
    },
    [flushPersistMessage],
  );

  const onCorrectionPersist = useCallback(
    (snippet: string) => {
      trackEvent('correction_received', { scenario_id: scenario.id, length: snippet.length });
      const cid = conversationIdRef.current;
      if (!cid || !env.supabaseConfigured) return;
      void addCorrection(supabase, { conversationId: cid, userId, body: snippet }).catch((e) =>
        console.warn('addCorrection', e),
      );
    },
    [userId, scenario.id],
  );

  const voiceParams = useMemo((): UseVoxaVoiceSessionParams => {
    return {
      scenarioId: scenario.id,
      scenarioTitle: scenario.title,
      learningPath: toApiLearningPath(scenario.languages[0] ?? 'english_business'),
      userLevel: 'intermediate',
      authToken: accessToken,
      onTranscriptPersist,
      onCorrectionPersist,
    };
  }, [scenario, accessToken, onTranscriptPersist, onCorrectionPersist]);

  const { phase, errorMessage, messages, corrections, sessionSummary, muted, startSession, endSession, toggleMute } =
    useVoxaVoiceSession(voiceParams);

  const [closing, setClosing] = useState(false);

  const startWithPersistence = useCallback(async () => {
    setSessionStats(null);
    conversationIdRef.current = null;
    if (env.supabaseConfigured) {
      try {
        const row = await createConversation(supabase, {
          userId,
          scenarioId: scenario.id,
          scenarioTitle: scenario.title,
          learningPath: toApiLearningPath(scenario.languages[0] ?? 'english_business'),
          userLevel: 'intermediate',
        });
        conversationIdRef.current = row.id;
      } catch (e) {
        console.warn('createConversation', e);
        Alert.alert('Could not start', 'We could not create your session record. Check your connection and try again.');
        return;
      }
    }
    await startSession();
  }, [userId, scenario, startSession]);

  const onEnd = useCallback(async () => {
    setClosing(true);
    const hadTranscript = messages.length > 0;
    const correctionCount = corrections.length;
    const cid = conversationIdRef.current;

    for (const t of messageTimersRef.current.values()) clearTimeout(t);
    messageTimersRef.current.clear();

    try {
      const summaryResult = await endSession();
      const xpEarned = hadTranscript ? XP_FOR_SESSION : 0;
      setSessionStats({
        durationSeconds: summaryResult.durationSeconds,
        xpEarned,
        correctionCount,
      });

      if (env.supabaseConfigured && cid) {
        try {
          await completeConversation(supabase, {
            conversationId: cid,
            userId,
            summary: summaryResult.summary,
            xpAwarded: xpEarned,
            status: 'completed',
          });
        } catch (e) {
          console.warn('completeConversation', e);
        }
      }
      if (hadTranscript) {
        await addXpFromSession(XP_FOR_SESSION, { conversationId: cid ?? undefined, source: 'voice_session' });
      }

      trackEvent('voice_session_completed', {
        scenario_id: scenario.id,
        duration_seconds: summaryResult.durationSeconds,
        correction_count: correctionCount,
        had_transcript: hadTranscript,
        xp_earned: xpEarned,
      });
    } finally {
      setClosing(false);
    }
  }, [addXpFromSession, corrections.length, endSession, messages.length, scenario.id, userId]);

  const showPostSummary = phase === 'ended' && sessionSummary;
  const busyStarting =
    phase === 'requesting_permission' || phase === 'minting_session' || phase === 'connecting' || closing;
  const live = phase === 'connected' || phase === 'listening' || phase === 'ai_speaking';

  return (
    <GradientBackground>
      <View style={[styles.container, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => {
              if (live) {
                Alert.alert('End session?', 'This will stop the voice conversation.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'End', style: 'destructive', onPress: () => void onEnd() },
                ]);
              } else {
                router.back();
              }
            }}
            hitSlop={12}>
            <VoxaText variant="caption" style={styles.close}>
              {live ? 'End' : 'Close'}
            </VoxaText>
          </Pressable>
        </View>

        <View style={styles.header}>
          <VoxaText variant="caption" style={styles.overline}>
            TestFlight beta · Live practice
          </VoxaText>
          <VoxaText variant="title">{scenario.title}</VoxaText>
          <VoxaText variant="muted">{scenario.subtitle}</VoxaText>
          <BetaDisclaimer compact />
        </View>

        <View style={styles.orb}>
          <VoiceOrb phase={phase} />
        </View>

        {showPostSummary ? (
          <GlassPanel style={styles.panel}>
            <VoxaText variant="caption" style={styles.recapLabel}>
              Session recap
            </VoxaText>
            <VoxaText variant="lead">{sessionSummary}</VoxaText>
            {sessionStats ? (
              <View style={styles.recapStats}>
                <VoxaText variant="body">Duration · {formatDuration(sessionStats.durationSeconds)}</VoxaText>
                <VoxaText variant="body">XP earned · {sessionStats.xpEarned}</VoxaText>
                <VoxaText variant="body">Gentle notes · {sessionStats.correctionCount}</VoxaText>
              </View>
            ) : null}
            <BetaDisclaimer compact />
            <VoxaButton
              title="View history"
              variant="ghost"
              onPress={() => router.push('/(app)/history')}
              containerStyle={styles.historyBtn}
            />
            <VoxaButton title="Done" onPress={() => router.back()} containerStyle={styles.primaryBtn} />
          </GlassPanel>
        ) : (
          <>
            <GlassPanel style={styles.panel}>
              {busyStarting ? (
                <View style={styles.rowCenter}>
                  <ActivityIndicator color={palette.cyan} />
                  <VoxaText variant="body" style={styles.statusPad}>
                    {phaseHint(phase)}
                  </VoxaText>
                </View>
              ) : (
                <VoxaText variant="body">{errorMessage ?? phaseHint(phase)}</VoxaText>
              )}
            </GlassPanel>

            <CorrectionChips items={corrections} />

            <LiveTranscriptList messages={messages} />

            <View style={styles.actions}>
              {!live && phase !== 'error' ? (
                <VoxaButton title="Start session" disabled={busyStarting} onPress={startWithPersistence} />
              ) : null}

              {live ? (
                <View style={styles.row}>
                  <Pressable
                    onPress={toggleMute}
                    style={({ pressed }) => [styles.iconBtn, pressed && styles.iconPressed]}
                    accessibilityRole="button"
                    accessibilityLabel={muted ? 'Unmute microphone' : 'Mute microphone'}>
                    <Ionicons name={muted ? 'mic-off' : 'mic'} size={22} color={palette.cyan} />
                  </Pressable>
                  <VoxaButton
                    title="End session"
                    variant="ghost"
                    onPress={onEnd}
                    disabled={closing}
                    containerStyle={styles.flex}
                  />
                </View>
              ) : null}

              {phase === 'error' ? (
                <>
                  <VoxaButton title="Try again" onPress={startWithPersistence} containerStyle={styles.gap} />
                  <VoxaButton title="Leave" variant="subtle" onPress={() => router.back()} />
                </>
              ) : null}
            </View>
          </>
        )}
      </View>
    </GradientBackground>
  );
}

export default function ConversationScreen() {
  const params = useLocalSearchParams<{ scenarioId: string }>();
  const scenario = useMemo(() => getScenario(params.scenarioId as ScenarioId), [params.scenarioId]);
  const { session, user } = useAuth();

  if (!scenario) {
    return (
      <GradientBackground>
        <View style={[styles.center, { padding: spacing.xl }]}>
          <VoxaText variant="title">Scenario not found</VoxaText>
          <VoxaText variant="body" style={styles.centerText}>
            The link may be out of date. Head back and pick a scenario from the list.
          </VoxaText>
          <BetaDisclaimer compact />
          <VoxaButton title="Go back" onPress={() => router.back()} containerStyle={{ marginTop: spacing.lg }} />
        </View>
      </GradientBackground>
    );
  }

  if (!user || !session?.access_token) {
    return (
      <GradientBackground>
        <View style={[styles.center, { padding: spacing.xl }]}>
          <VoxaText variant="title">Sign in to practice</VoxaText>
          <VoxaText variant="body" style={styles.centerText}>
            Voice sessions use a secure server — sign in on the Profile tab first.
          </VoxaText>
          <BetaDisclaimer compact />
          <VoxaButton title="Go to profile" onPress={() => router.replace('/(app)/(tabs)/profile')} />
        </View>
      </GradientBackground>
    );
  }

  return <ConversationSessionActive scenario={scenario} userId={user.id} accessToken={session.access_token} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  close: {
    color: '#38D9FF',
    fontWeight: '600',
  },
  header: {
    gap: spacing.xs,
  },
  overline: {
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  orb: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  panel: {
    marginTop: spacing.xs,
  },
  actions: {
    marginTop: 'auto',
    gap: spacing.sm,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
  },
  centerText: {
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  statusPad: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  flex: {
    flex: 1,
  },
  iconBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.frost,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.frostStrong,
  },
  iconPressed: {
    opacity: 0.85,
  },
  gap: {
    marginBottom: spacing.xs,
  },
  primaryBtn: {
    marginTop: spacing.md,
  },
  recapLabel: {
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    opacity: 0.8,
    marginBottom: spacing.xs,
  },
  recapStats: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  historyBtn: {
    marginTop: spacing.md,
  },
});
