import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { LessonNodeCard } from '@/components/lessons/LessonNodeCard';
import { BetaDisclaimer } from '@/components/ui/BetaDisclaimer';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { ScreenLoading } from '@/components/ui/ScreenStates';
import { VoxaText } from '@/components/ui/VoxaText';
import { getLessonsForPath, levelLabel } from '@/constants/lessonPaths';
import { DEFAULT_LAUNCH_LANGUAGE, launchLanguageLabel } from '@/lib/learningPath/display';
import { spacing } from '@/constants/theme';
import { getGuidedProfile } from '@/lib/onboarding/guidedProfile';
import { getCompletedLessonIds, isLessonCompleted, isLessonUnlocked } from '@/lib/lessons/progress';
import { openLessonDetail } from '@/lib/lessons/openLesson';
import { useProgress } from '@/lib/progress/useProgress';
import type { LearnerLevel, LearningLanguage } from '@/lib/learning/types';

export default function LessonMapScreen() {
  const insets = useSafeAreaInsets();
  const { progress } = useProgress();
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<LearningLanguage>(DEFAULT_LAUNCH_LANGUAGE);
  const [level, setLevel] = useState<LearnerLevel>('beginner');
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        setLoading(true);
        const [profile, completed] = await Promise.all([getGuidedProfile(), getCompletedLessonIds()]);
        setLanguage(profile.targetLanguage ?? DEFAULT_LAUNCH_LANGUAGE);
        setLevel(profile.level ?? 'beginner');
        setCompletedIds(completed);
        setLoading(false);
      })();
    }, []),
  );

  if (loading) {
    return <ScreenLoading message="Loading your path…" />;
  }

  const lessons = getLessonsForPath(language, level);

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <VoxaText variant="caption" style={styles.back}>
              ← Back
            </VoxaText>
          </Pressable>
          <View style={styles.streakPill}>
            <VoxaText variant="caption" style={styles.streakText}>
              🔥 {progress?.streak ?? 0} day streak
            </VoxaText>
          </View>
        </View>

        <VoxaText variant="caption" style={styles.overline}>
          Guided lessons
        </VoxaText>
        <VoxaText variant="title">{launchLanguageLabel(language)}</VoxaText>
        <VoxaText variant="body">{levelLabel(level)} path · {lessons.length} lessons</VoxaText>
        <BetaDisclaimer compact />

        <VoxaText variant="muted" style={styles.hint}>
          Complete each lesson to unlock the next. Practice saves to History and XP as usual.
        </VoxaText>

        <View style={styles.path}>
          {lessons.map((lesson, index) => {
            const locked = !isLessonUnlocked(lesson.id, language, level, completedIds);
            const completed = isLessonCompleted(lesson.id, completedIds);
            return (
              <View key={lesson.id} style={styles.nodeWrap}>
                {index > 0 ? <View style={styles.connector} /> : null}
                <LessonNodeCard
                  lesson={lesson}
                  locked={locked}
                  completed={completed}
                  onPress={() => openLessonDetail(lesson.id)}
                />
              </View>
            );
          })}
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  back: {
    color: '#38D9FF',
    fontWeight: '600',
  },
  streakPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  streakText: {
    fontWeight: '600',
  },
  overline: {
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  hint: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  path: {
    gap: 0,
  },
  nodeWrap: {
    alignItems: 'stretch',
  },
  connector: {
    width: 2,
    height: spacing.md,
    backgroundColor: 'rgba(56, 217, 255, 0.25)',
    alignSelf: 'center',
  },
});
