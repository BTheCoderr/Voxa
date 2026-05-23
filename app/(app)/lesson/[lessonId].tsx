import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BetaDisclaimer } from '@/components/ui/BetaDisclaimer';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { VoxaButton } from '@/components/ui/VoxaButton';
import { VoxaText } from '@/components/ui/VoxaText';
import { getLessonById } from '@/constants/lessonPaths';
import { palette, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth/AuthContext';
import { env } from '@/lib/env';
import { getGuidedProfile } from '@/lib/onboarding/guidedProfile';
import { openImmersivePractice, openLessonPractice } from '@/lib/lessons/openLesson';
import { markLessonCompleted } from '@/lib/lessons/progress';
import type { LaunchLanguage, ScenarioId } from '@/constants/scenarios';
import type { LessonMode } from '@/lib/learning/types';
import { toApiLearningPath } from '@/lib/realtime/learningPath';
import { fetchTtsAudio, getTtsUserErrorMessage, playBase64Audio } from '@/lib/tts/elevenLabsTts';

export default function LessonDetailScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const [tab, setTab] = useState<LessonMode>('lecture');
  const [language, setLanguage] = useState<LaunchLanguage>('english_business');
  const [ttsBusyId, setTtsBusyId] = useState<string | null>(null);
  const [ttsError, setTtsError] = useState<string | null>(null);

  const lesson = useMemo(() => (lessonId ? getLessonById(lessonId) : undefined), [lessonId]);

  useEffect(() => {
    void getGuidedProfile().then((p) => {
      if (p.targetLanguage) setLanguage(p.targetLanguage);
    });
  }, []);

  const playBubble = useCallback(
    async (bubbleId: string, text: string) => {
      if (!lesson) return;
      if (!env.elevenLabsTtsConfigured || !session?.access_token) {
        setTtsError('Sign in to hear voice playback.');
        return;
      }
      setTtsBusyId(bubbleId);
      setTtsError(null);
      try {
        const audio = await fetchTtsAudio(
          {
            text,
            scenarioId: lesson.scenarioId,
            learningPath: toApiLearningPath(language),
          },
          session.access_token,
        );
        await playBase64Audio(audio.audioBase64, audio.contentType);
      } catch (e) {
        setTtsError(getTtsUserErrorMessage(e));
      } finally {
        setTtsBusyId(null);
      }
    },
    [session?.access_token, lesson, language],
  );

  if (!lesson) {
    return (
      <GradientBackground>
        <View style={[styles.center, { paddingTop: insets.top }]}>
          <VoxaText variant="title">Lesson not found</VoxaText>
          <VoxaButton title="Go back" onPress={() => router.back()} />
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <VoxaText variant="caption" style={styles.back}>
            ← Lesson map
          </VoxaText>
        </Pressable>

        <VoxaText variant="caption" style={styles.overline}>
          Lesson {lesson.order}
        </VoxaText>
        <VoxaText variant="title">{lesson.title}</VoxaText>
        <VoxaText variant="body">{lesson.subtitle}</VoxaText>
        <BetaDisclaimer compact />

        <View style={styles.tabs}>
          <TabButton label="Lecture" active={tab === 'lecture'} onPress={() => setTab('lecture')} />
          <TabButton label="Practice" active={tab === 'practice'} onPress={() => setTab('practice')} />
        </View>

        {tab === 'lecture' ? (
          <View style={styles.lecture}>
            {lesson.lecture.map((bubble) => (
              <GlassPanel key={bubble.id} style={styles.lectureBubble}>
                <VoxaText variant="body">{bubble.text}</VoxaText>
                <Pressable
                  onPress={() => void playBubble(bubble.id, bubble.text)}
                  disabled={ttsBusyId === bubble.id}
                  style={styles.hearBtn}>
                  {ttsBusyId === bubble.id ? (
                    <ActivityIndicator size="small" color={palette.cyan} />
                  ) : (
                    <VoxaText variant="caption" style={styles.hearText}>
                      Hear this · manual playback
                    </VoxaText>
                  )}
                </Pressable>
              </GlassPanel>
            ))}
            {ttsError ? (
              <VoxaText variant="muted" style={styles.ttsErr}>
                {ttsError}
              </VoxaText>
            ) : null}
            <VoxaButton title="Start practice" onPress={() => setTab('practice')} containerStyle={styles.cta} />
          </View>
        ) : (
          <View style={styles.practice}>
            <GlassPanel style={styles.practiceCard}>
              <VoxaText variant="lead">Scenario practice</VoxaText>
              <VoxaText variant="body">
                Practice this lesson in a guided conversation. Type your replies — voice playback stays manual.
              </VoxaText>
              <VoxaText variant="muted">
                AI may be imperfect. This is a practice aid, not a certified language test.
              </VoxaText>
            </GlassPanel>

            <VoxaButton
              title="Start text practice"
              onPress={() => {
                openLessonPractice(lesson.scenarioId as ScenarioId, language, lesson.id);
              }}
            />

            <VoxaButton
              title="Immersive practice (visual)"
              variant="ghost"
              onPress={() => openImmersivePractice(lesson.id)}
              containerStyle={styles.ghostCta}
            />

            <VoxaButton
              title="Mark lesson complete"
              variant="subtle"
              onPress={async () => {
                await markLessonCompleted(lesson.id);
                router.back();
              }}
              containerStyle={styles.ghostCta}
            />
          </View>
        )}
      </ScrollView>
    </GradientBackground>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.tab, active && styles.tabActive]}>
      <VoxaText variant="body" style={active ? styles.tabTextActive : styles.tabText}>
        {label}
      </VoxaText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  center: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    gap: spacing.md,
  },
  back: {
    color: palette.cyan,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  overline: {
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: palette.frost,
  },
  tabActive: {
    backgroundColor: 'rgba(59, 108, 255, 0.35)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.cyanMuted,
  },
  tabText: {
    opacity: 0.75,
  },
  tabTextActive: {
    fontWeight: '600',
  },
  lecture: {
    gap: spacing.sm,
  },
  lectureBubble: {
    gap: spacing.sm,
  },
  hearBtn: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  hearText: {
    color: palette.cyan,
    fontWeight: '600',
  },
  ttsErr: {
    color: palette.textSecondary,
  },
  cta: {
    marginTop: spacing.md,
  },
  practice: {
    gap: spacing.md,
  },
  practiceCard: {
    gap: spacing.sm,
  },
  ghostCta: {
    marginTop: spacing.xs,
  },
});
