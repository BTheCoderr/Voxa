import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LanguagePathPicker } from '@/components/practice/LanguagePathPicker';
import { TabletContent } from '@/components/layout/TabletContent';
import { PracticeModeFraming } from '@/components/practice/PracticeModeFraming';
import { ScenarioCard } from '@/components/scenario/ScenarioCard';
import { ScreenshotMarketingBanner } from '@/components/marketing/ScreenshotMarketingBanner';
import { PolishedEmptyState } from '@/components/marketing/PolishedEmptyState';
import { BetaDisclaimer } from '@/components/ui/BetaDisclaimer';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { ScreenLoading } from '@/components/ui/ScreenStates';
import { VoxaButton } from '@/components/ui/VoxaButton';
import { VoxaText } from '@/components/ui/VoxaText';
import { SCENARIOS, type LaunchLanguage } from '@/constants/scenarios';
import { spacing } from '@/constants/theme';
import { trackEvent } from '@/lib/analytics/track';
import { openScenarioPractice } from '@/lib/ai/openPractice';
import { isTextPracticeMode, isVoicePracticeMode } from '@/lib/ai/mode';
import { isGuidedLessonsEnabled } from '@/lib/lessons/guidedLessonsEnabled';
import { openLessonDetail, openLessonMap } from '@/lib/lessons/openLesson';
import {
  findContinueLesson,
  getCompletedLessonIds,
  hasLessonProgress,
} from '@/lib/lessons/progress';
import { DEFAULT_LAUNCH_LANGUAGE, launchLanguageLabel } from '@/lib/learningPath/display';
import type { LearnerLevel, LessonNode } from '@/lib/learning/types';
import { getGuidedProfile } from '@/lib/onboarding/guidedProfile';
import { isScreenshotMode } from '@/lib/presentation/screenshotMode';
import { getPreferredLanguage, setPreferredLanguage } from '@/lib/preferences/storage';
import { useFocusEffect } from '@react-navigation/native';

export default function ScenariosHomeScreen() {
  const insets = useSafeAreaInsets();
  const guidedEnabled = isGuidedLessonsEnabled();
  const [language, setLanguage] = useState<LaunchLanguage | null | undefined>(undefined);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [continueLesson, setContinueLesson] = useState<LessonNode | null>(null);
  const [pathLevel, setPathLevel] = useState<LearnerLevel>('beginner');

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        const [stored, completed, profile] = await Promise.all([
          getPreferredLanguage(),
          getCompletedLessonIds(),
          getGuidedProfile(),
        ]);
        const effectiveLanguage = profile.targetLanguage ?? stored ?? DEFAULT_LAUNCH_LANGUAGE;
        const level = profile.level ?? 'beginner';
        setLanguage(stored ?? DEFAULT_LAUNCH_LANGUAGE);
        setCompletedLessonIds(completed);
        setPathLevel(level);
        setContinueLesson(findContinueLesson(effectiveLanguage, level, completed));
      })();
    }, []),
  );

  const onLanguageChange = useCallback(async (lang: LaunchLanguage) => {
    setLanguage(lang);
    await setPreferredLanguage(lang);
    trackEvent('learning_path_selected', { language: lang });
  }, []);

  const effectiveLanguage = language ?? DEFAULT_LAUNCH_LANGUAGE;
  const showContinue = guidedEnabled && hasLessonProgress(completedLessonIds);

  const filtered = useMemo(() => {
    return SCENARIOS.filter((s) => s.languages.includes(effectiveLanguage));
  }, [effectiveLanguage]);

  if (language === undefined) {
    return <ScreenLoading message="Loading practice…" />;
  }

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}>
        <TabletContent fullWidth>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <VoxaText variant="caption" style={styles.overline}>
              {isVoicePracticeMode() ? 'Live voice · Premium' : 'Text practice · Low cost'}
            </VoxaText>
            <VoxaText variant="title">Practice</VoxaText>
            <VoxaText variant="body">
              {isVoicePracticeMode()
                ? 'Live voice practice — speak out loud. Experimental premium mode.'
                : 'Quick scenarios or a structured lesson path — voice playback is manual.'}
            </VoxaText>
            <BetaDisclaimer compact />
          </View>
          <Pressable onPress={() => router.push('/(app)/history')} style={styles.historyHit}>
            <VoxaText variant="caption" style={styles.history}>
              History
            </VoxaText>
          </Pressable>
        </View>

        {guidedEnabled ? (
          <>
            <VoxaText variant="caption" style={styles.sectionLabel}>
              Guided lessons
            </VoxaText>
            <GlassPanel style={styles.guidedCard}>
              <VoxaText variant="lead">Structured path</VoxaText>
              <VoxaText variant="muted">
                Lecture → practice with unlockable lessons. Available anytime — no onboarding required.
              </VoxaText>
              {showContinue && continueLesson ? (
                <VoxaButton
                  title={`Continue · ${continueLesson.title}`}
                  onPress={() => {
                    trackEvent('guided_lessons_continue', { lesson_id: continueLesson.id });
                    openLessonDetail(continueLesson.id);
                  }}
                  containerStyle={styles.guidedBtnPrimary}
                />
              ) : null}
              {showContinue && !continueLesson ? (
                <VoxaText variant="muted" style={styles.pathComplete}>
                  Path complete — review any lesson on the map.
                </VoxaText>
              ) : null}
              <VoxaButton
                title="Open lesson map"
                variant={showContinue ? 'ghost' : 'primary'}
                onPress={() => {
                  trackEvent('guided_lessons_opened', { learning_path: effectiveLanguage });
                  openLessonMap();
                }}
                containerStyle={styles.guidedBtn}
              />
            </GlassPanel>
          </>
        ) : null}

        <VoxaText variant="caption" style={styles.sectionLabel}>
          Quick practice
        </VoxaText>

        <LanguagePathPicker value={effectiveLanguage} onChange={(lang) => void onLanguageChange(lang)} />

        <VoxaText variant="caption" style={styles.pathHint}>
          Practicing · {launchLanguageLabel(effectiveLanguage)}
          {guidedEnabled && showContinue ? ` · ${pathLevel} path in progress` : ''}
        </VoxaText>

        {!isScreenshotMode() && !isVoicePracticeMode() ? <PracticeModeFraming /> : null}

        {isScreenshotMode() ? <ScreenshotMarketingBanner /> : null}

        {filtered.length === 0 ? (
          <View style={styles.emptyBlock}>
            <PolishedEmptyState
              title="No scenarios for this path"
              body="Try another learning path above."
              compact
            />
          </View>
        ) : (
          <View style={{ marginTop: spacing.lg }}>
            {filtered.map((scenario) => (
              <ScenarioCard
                key={scenario.id}
                scenario={scenario}
                actionLabel={isVoicePracticeMode() ? 'Start voice practice' : 'Start text practice'}
                badge={isVoicePracticeMode() ? undefined : 'Text'}
                onPress={() => {
                  trackEvent('scenario_selected', {
                    scenario_id: scenario.id,
                    mode: isVoicePracticeMode() ? 'voice' : 'text',
                    learning_path: effectiveLanguage,
                  });
                  openScenarioPractice(scenario.id, effectiveLanguage);
                }}
              />
            ))}
          </View>
        )}

        {isTextPracticeMode() ? (
          <Pressable
            style={styles.premiumRow}
            onPress={() => {
              trackEvent('premium_voice_teaser_tapped');
            }}>
            <VoxaText variant="caption" style={styles.premiumBadge}>
              Premium · Coming soon
            </VoxaText>
            <VoxaText variant="body" style={styles.premiumTitle}>
              Live Voice Practice
            </VoxaText>
            <VoxaText variant="muted">
              Full speech-to-speech conversation — not available in text mode yet.
            </VoxaText>
          </Pressable>
        ) : null}
        </TabletContent>
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
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  overline: {
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  pathHint: {
    marginTop: spacing.sm,
    letterSpacing: 0.6,
    opacity: 0.85,
  },
  guidedCard: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  guidedBtnPrimary: {
    marginTop: spacing.sm,
  },
  guidedBtn: {
    marginTop: spacing.sm,
  },
  pathComplete: {
    marginTop: spacing.sm,
  },
  sectionLabel: {
    marginTop: spacing.lg,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    opacity: 0.85,
  },
  historyHit: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  history: {
    color: '#38D9FF',
    fontWeight: '600',
  },
  emptyBlock: {
    marginTop: spacing.xl,
  },
  premiumRow: {
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
    gap: spacing.xs,
  },
  premiumBadge: {
    letterSpacing: 1,
    textTransform: 'uppercase',
    opacity: 0.75,
  },
  premiumTitle: {
    fontWeight: '600',
  },
});
