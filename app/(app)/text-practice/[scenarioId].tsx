import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TextCorrectionCards } from '@/components/conversation/TextCorrectionCards';
import { TextMessageList, type TextChatMessage } from '@/components/conversation/TextMessageList';
import { BetaDisclaimer } from '@/components/ui/BetaDisclaimer';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { VoxaButton } from '@/components/ui/VoxaButton';
import { VoxaText } from '@/components/ui/VoxaText';
import type { Scenario, ScenarioId } from '@/constants/scenarios';
import { getScenario } from '@/constants/scenarios';
import { palette, spacing } from '@/constants/theme';
import { fetchChatCoachReply } from '@/lib/ai/chatCoach';
import type { ChatCoachCorrection } from '@/lib/ai/providers/types';
import { trackEvent } from '@/lib/analytics/track';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  addConversationMessage,
  addCorrection,
  completeConversation,
  createConversation,
} from '@/lib/db/conversations';
import { env } from '@/lib/env';
import {
  DEFAULT_LAUNCH_LANGUAGE,
  parseApiLearningPath,
  textPracticeOverline,
} from '@/lib/learningPath/display';
import { getPreferredLanguage } from '@/lib/preferences/storage';
import { useProgress } from '@/lib/progress/useProgress';
import { toApiLearningPath } from '@/lib/realtime/learningPath';
import type { UserLevel } from '@/lib/realtime/types';
import { supabase } from '@/lib/supabase/client';
import { fetchTtsAudio, getTtsUserErrorMessage, playBase64Audio } from '@/lib/tts/elevenLabsTts';

const XP_FOR_SESSION = 20;
const USER_LEVEL: UserLevel = 'intermediate';

function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m <= 0) return `${s}s`;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

type TextSessionActiveProps = {
  scenario: Scenario;
  userId: string;
  accessToken: string;
  learningPath: ReturnType<typeof toApiLearningPath>;
  pathOverline: string;
};

function TextSessionActive({
  scenario,
  userId,
  accessToken,
  learningPath,
  pathOverline,
}: TextSessionActiveProps) {
  const insets = useSafeAreaInsets();
  const { addXpFromSession } = useProgress();
  const listRef = useRef<ScrollView>(null);

  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<TextChatMessage[]>([]);
  const [latestCorrections, setLatestCorrections] = useState<ChatCoachCorrection[]>([]);
  const [latestEncouragement, setLatestEncouragement] = useState('');
  const [latestAssistantText, setLatestAssistantText] = useState('');
  const [ttsBusy, setTtsBusy] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionSummary, setSessionSummary] = useState<string | null>(null);
  const [sessionStats, setSessionStats] = useState<{
    durationSeconds: number;
    xpEarned: number;
    correctionCount: number;
  } | null>(null);

  useEffect(() => {
    if (__DEV__) {
      console.log('[tts] configured', env.elevenLabsTtsConfigured);
    }
  }, []);

  const scrollTranscriptToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  const conversationIdRef = useRef<string | null>(null);
  const correctionCountRef = useRef(0);
  const sessionEndedRef = useRef(false);
  const lastAiMetaRef = useRef<{ providerUsed?: string; usedFallback?: boolean }>({});

  const coachMessages = useMemo(
    () => messages.map((m) => ({ role: m.role, content: m.text })),
    [messages],
  );

  const ensureConversation = useCallback(async (): Promise<boolean> => {
    if (conversationIdRef.current) return true;
    if (!env.supabaseConfigured) return true;

    try {
      const row = await createConversation(supabase, {
        userId,
        scenarioId: scenario.id,
        scenarioTitle: scenario.title,
        learningPath,
        userLevel: USER_LEVEL,
      });
      conversationIdRef.current = row.id;
      return true;
    } catch (e) {
      console.warn('createConversation', e);
      Alert.alert('Could not start', 'We could not create your session record. Check your connection.');
      return false;
    }
  }, [userId, scenario, learningPath]);

  const persistMessage = useCallback(
    async (role: 'user' | 'assistant', text: string, clientMessageId: string) => {
      const cid = conversationIdRef.current;
      if (!cid || !env.supabaseConfigured) return;
      try {
        await addConversationMessage(supabase, {
          conversationId: cid,
          userId,
          role,
          body: text,
          clientMessageId,
          isFinal: true,
        });
      } catch (e) {
        console.warn('addConversationMessage', e);
      }
    },
    [userId],
  );

  const persistCorrection = useCallback(
    async (c: ChatCoachCorrection) => {
      const cid = conversationIdRef.current;
      if (!cid || !env.supabaseConfigured) return;
      const body = [c.original, c.improved, c.explanation].filter(Boolean).join(' · ');
      try {
        await addCorrection(supabase, {
          conversationId: cid,
          userId,
          body,
          original: c.original,
          improved: c.improved,
          explanation: c.explanation,
        });
      } catch (e) {
        console.warn('addCorrection', e);
      }
    },
    [userId],
  );

  const startSession = useCallback(async () => {
    setErrorMessage(null);
    setSessionSummary(null);
    setSessionStats(null);
    setMessages([]);
    setLatestCorrections([]);
    setLatestEncouragement('');
    setLatestAssistantText('');
    setTtsError(null);
    correctionCountRef.current = 0;
    conversationIdRef.current = null;
    sessionEndedRef.current = false;
    lastAiMetaRef.current = {};

    if (!env.aiChatCoachConfigured) {
      setErrorMessage(
        'Text coach is not configured. Set EXPO_PUBLIC_AI_CHAT_COACH_URL and deploy the ai-chat-coach Edge Function.',
      );
      return;
    }

    const ok = await ensureConversation();
    if (!ok) return;

    setSessionActive(true);
    setStartedAt(Date.now());
    trackEvent('text_session_started', { scenario_id: scenario.id });
  }, [ensureConversation, scenario.id]);

  const sendMessage = useCallback(async () => {
    const text = draft.trim();
    if (!text || busy || !sessionActive) return;

    setDraft('');
    setErrorMessage(null);
    setLatestCorrections([]);
    setLatestEncouragement('');
    setTtsError(null);
    setBusy(true);

    const userIdMsg = nextId('user');
    const userMsg: TextChatMessage = { id: userIdMsg, role: 'user', text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    void persistMessage('user', text, userIdMsg);

    try {
      const result = await fetchChatCoachReply(
        {
          scenarioId: scenario.id,
          learningPath,
          userLevel: USER_LEVEL,
          messages: [...coachMessages, { role: 'user', content: text }],
        },
        accessToken,
      );

      const assistantId = nextId('assistant');
      const assistantMsg: TextChatMessage = { id: assistantId, role: 'assistant', text: result.reply };
      setMessages((prev) => [...prev, assistantMsg]);
      setLatestCorrections(result.corrections);
      setLatestEncouragement(result.encouragement);
      setLatestAssistantText(result.reply);
      correctionCountRef.current += result.corrections.length;
      lastAiMetaRef.current = {
        providerUsed: result.providerUsed,
        usedFallback: result.usedFallback,
      };

      void persistMessage('assistant', result.reply, assistantId);
      for (const c of result.corrections) {
        void persistCorrection(c);
        trackEvent('correction_received', { scenario_id: scenario.id, mode: 'text' });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not reach the AI coach.';
      setErrorMessage(msg);
    } finally {
      setBusy(false);
    }
  }, [
    draft,
    busy,
    sessionActive,
    messages,
    coachMessages,
    persistMessage,
    persistCorrection,
    scenario.id,
    learningPath,
    accessToken,
  ]);

  const playAssistantVoice = useCallback(async () => {
    if (!latestAssistantText.trim() || ttsBusy) return;

    if (!env.elevenLabsTtsConfigured) {
      setTtsError('Voice playback is not set up yet.');
      return;
    }

    setTtsError(null);
    setTtsBusy(true);
    trackEvent('tts_play_tapped', { scenario_id: scenario.id, mode: 'text' });

    try {
      const audio = await fetchTtsAudio(
        {
          text: latestAssistantText,
          scenarioId: scenario.id,
          learningPath,
        },
        accessToken,
      );
      await playBase64Audio(audio.audioBase64, audio.contentType);
    } catch (e) {
      setTtsError(getTtsUserErrorMessage(e));
    } finally {
      setTtsBusy(false);
    }
  }, [latestAssistantText, ttsBusy, scenario.id, learningPath, accessToken]);

  useEffect(() => {
    scrollTranscriptToEnd();
  }, [messages, latestCorrections, latestAssistantText, busy, scrollTranscriptToEnd]);

  const abandonEmptySession = useCallback(async () => {
    const cid = conversationIdRef.current;
    if (!cid || !env.supabaseConfigured) return;
    try {
      await completeConversation(supabase, {
        conversationId: cid,
        userId,
        summary: 'Session ended before any messages.',
        xpAwarded: 0,
        status: 'aborted',
      });
    } catch (e) {
      console.warn('completeConversation (aborted)', e);
    }
  }, [userId]);

  const endSession = useCallback(async () => {
    if (sessionEndedRef.current) return;
    sessionEndedRef.current = true;

    const hadMessages = messages.length > 0;
    const durationSeconds = startedAt ? Math.max(0, Math.round((Date.now() - startedAt) / 1000)) : 0;
    const xpEarned = hadMessages ? XP_FOR_SESSION : 0;
    const correctionCount = correctionCountRef.current;
    const cid = conversationIdRef.current;

    const summary = `You completed a text practice in “${scenario.title}”. Steady reps build calm, confident speaking.`;
    setSessionSummary(summary);
    setSessionStats({ durationSeconds, xpEarned, correctionCount });
    setSessionActive(false);
    setStartedAt(null);

    if (env.supabaseConfigured && cid) {
      try {
        await completeConversation(supabase, {
          conversationId: cid,
          userId,
          summary,
          xpAwarded: xpEarned,
          status: 'completed',
          aiProviderUsed: lastAiMetaRef.current.providerUsed ?? null,
          aiUsedFallback: lastAiMetaRef.current.usedFallback ?? null,
        });
      } catch (e) {
        console.warn('completeConversation', e);
      }
    }

    if (hadMessages) {
      await addXpFromSession(xpEarned, { conversationId: cid ?? undefined, source: 'text_session' });
    }

    trackEvent('text_session_completed', {
      scenario_id: scenario.id,
      duration_seconds: durationSeconds,
      correction_count: correctionCount,
      message_count: messages.length,
      xp_earned: xpEarned,
    });
  }, [addXpFromSession, messages.length, scenario, startedAt, userId]);

  const showRecap = sessionSummary !== null;

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}>
        <View
          style={[
            styles.container,
            { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md },
          ]}>
          <View style={styles.topBar}>
            <Pressable
              onPress={() => {
                if (sessionActive && messages.length > 0) {
                  Alert.alert('End session?', 'Your progress will be saved.', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'End', style: 'destructive', onPress: () => void endSession() },
                  ]);
                } else if (sessionActive) {
                  void abandonEmptySession();
                  setSessionActive(false);
                  setStartedAt(null);
                  conversationIdRef.current = null;
                } else {
                  router.back();
                }
              }}
              hitSlop={12}>
              <VoxaText variant="caption" style={styles.close}>
                {sessionActive ? 'End' : 'Close'}
              </VoxaText>
            </Pressable>
          </View>

          <View style={styles.header}>
            <VoxaText variant="caption" style={styles.overline}>
              {pathOverline}
            </VoxaText>
            <VoxaText variant="title">{scenario.title}</VoxaText>
            <VoxaText variant="muted">{scenario.subtitle}</VoxaText>
            <BetaDisclaimer compact />
          </View>

          {showRecap ? (
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
              <VoxaButton title="View history" variant="ghost" onPress={() => router.push('/(app)/history')} />
              <VoxaButton title="Done" onPress={() => router.back()} containerStyle={styles.gap} />
            </GlassPanel>
          ) : (
            <>
              {!sessionActive ? (
                <GlassPanel style={styles.panel}>
                  <VoxaText variant="body">
                    Type or dictate your line. Voxa will reply, correct you gently, and help you sound more
                    natural.
                  </VoxaText>
                  <VoxaText variant="caption" style={styles.helperMuted}>
                    Text practice — not full voice conversation. Tap &quot;Hear this response&quot; after a reply
                    for optional playback.
                  </VoxaText>
                  {errorMessage ? (
                    <VoxaText variant="body" style={styles.error}>
                      {errorMessage}
                    </VoxaText>
                  ) : null}
                  <VoxaButton title="Start text practice" onPress={() => void startSession()} containerStyle={styles.gap} />
                </GlassPanel>
              ) : (
                <View style={styles.sessionBody}>
                  <TextMessageList
                    messages={messages}
                    listRef={listRef}
                    footer={
                      <>
                        <TextCorrectionCards items={latestCorrections} encouragement={latestEncouragement} />
                        {latestAssistantText && !busy ? (
                          <View style={styles.voiceRow}>
                            <VoxaButton
                              title={ttsBusy ? 'Loading…' : 'Hear this response'}
                              variant="ghost"
                              disabled={ttsBusy}
                              onPress={() => void playAssistantVoice()}
                            />
                          </View>
                        ) : null}
                        {ttsError ? (
                          <VoxaText variant="body" style={styles.ttsError}>
                            {ttsError}
                          </VoxaText>
                        ) : null}
                      </>
                    }
                  />
                  <View style={styles.bottomDock}>
                    {errorMessage ? (
                      <VoxaText variant="body" style={styles.error}>
                        {errorMessage}
                      </VoxaText>
                    ) : null}
                    {busy ? (
                      <View style={styles.rowCenter}>
                        <ActivityIndicator color={palette.cyan} />
                        <VoxaText variant="body">Voxa is thinking…</VoxaText>
                      </View>
                    ) : null}
                    <View style={styles.composer}>
                      <TextInput
                        value={draft}
                        onChangeText={setDraft}
                        placeholder="Type or dictate your line…"
                        placeholderTextColor={palette.textMuted}
                        multiline
                        style={styles.input}
                        editable={!busy}
                      />
                      <VoxaButton
                        title="Send"
                        disabled={busy || !draft.trim()}
                        onPress={() => void sendMessage()}
                        containerStyle={styles.sendBtn}
                      />
                    </View>
                    <VoxaButton title="Finish session" variant="ghost" onPress={() => void endSession()} />
                  </View>
                </View>
              )}
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

export default function TextPracticeScreen() {
  const params = useLocalSearchParams<{ scenarioId: string; path?: string }>();
  const scenario = useMemo(() => getScenario(params.scenarioId as ScenarioId), [params.scenarioId]);
  const { session, user } = useAuth();
  const [learningPath, setLearningPath] = useState<ReturnType<typeof toApiLearningPath> | null>(null);

  useEffect(() => {
    void (async () => {
      const fromRoute = parseApiLearningPath(params.path);
      if (fromRoute) {
        setLearningPath(fromRoute);
        return;
      }
      const lang = await getPreferredLanguage();
      setLearningPath(toApiLearningPath(lang ?? DEFAULT_LAUNCH_LANGUAGE));
    })();
  }, [params.path]);

  const pathOverline = learningPath ? textPracticeOverline(learningPath) : 'Text Practice';

  if (!scenario) {
    return (
      <GradientBackground>
        <View style={[styles.center, { padding: spacing.xl }]}>
          <VoxaText variant="title">Scenario not found</VoxaText>
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
            Text sessions use the AI coach on our server — sign in on the Profile tab first.
          </VoxaText>
          <VoxaButton title="Go to profile" onPress={() => router.replace('/(app)/(tabs)/profile')} />
        </View>
      </GradientBackground>
    );
  }

  if (!learningPath) {
    return (
      <GradientBackground>
        <View style={[styles.center, { padding: spacing.xl }]}>
          <ActivityIndicator color={palette.cyan} />
        </View>
      </GradientBackground>
    );
  }

  return (
    <TextSessionActive
      scenario={scenario}
      userId={user.id}
      accessToken={session.access_token}
      learningPath={learningPath}
      pathOverline={pathOverline}
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  topBar: {
    flexDirection: 'row',
  },
  close: {
    color: palette.cyan,
    fontWeight: '600',
  },
  header: {
    gap: spacing.xs,
  },
  overline: {
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  panel: {
    marginTop: spacing.xs,
  },
  helperMuted: {
    marginTop: spacing.sm,
    opacity: 0.75,
  },
  gap: {
    marginTop: spacing.md,
  },
  sessionBody: {
    flex: 1,
    minHeight: 0,
    gap: spacing.sm,
  },
  bottomDock: {
    flexShrink: 0,
    gap: spacing.sm,
  },
  composer: {
    gap: spacing.sm,
  },
  input: {
    minHeight: 48,
    maxHeight: 120,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.frostStrong,
    backgroundColor: palette.frost,
    color: palette.textPrimary,
    fontSize: 16,
  },
  sendBtn: {},
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  error: {
    color: palette.danger,
  },
  voiceRow: {
    gap: spacing.xs,
  },
  ttsError: {
    color: palette.textMuted,
    fontStyle: 'italic',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
  },
  centerText: {
    textAlign: 'center',
    marginVertical: spacing.md,
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
});
