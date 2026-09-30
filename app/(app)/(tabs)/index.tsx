import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenshotMarketingBanner } from '@/components/marketing/ScreenshotMarketingBanner';
import { PolishedEmptyState } from '@/components/marketing/PolishedEmptyState';
import { DailyCoachCard } from '@/components/practice/DailyCoachCard';
import { LanguagePathPicker } from '@/components/practice/LanguagePathPicker';
import { PracticeModeFraming } from '@/components/practice/PracticeModeFraming';
import { ScenarioCard } from '@/components/scenario/ScenarioCard';
import { BetaDisclaimer } from '@/components/ui/BetaDisclaimer';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { ScreenLoading } from '@/components/ui/ScreenStates';
import { VoxaText } from '@/components/ui/VoxaText';
import { SCENARIOS, type LaunchLanguage } from '@/constants/scenarios';
import { palette, spacing } from '@/constants/theme';
import { trackEvent } from '@/lib/analytics/track';
import { openScenarioPractice } from '@/lib/ai/openPractice';
import { isTextPracticeMode, isVoicePracticeMode } from '@/lib/ai/mode';
import { DEFAULT_LAUNCH_LANGUAGE, launchLanguageLabel } from '@/lib/learningPath/display';
import { isScreenshotMode } from '@/lib/presentation/screenshotMode';
import { getPreferredLanguage, setPreferredLanguage } from '@/lib/preferences/storage';
import { getDailyMission, wasActiveToday } from '@/lib/practice/dailyMission';
import { getCoachLevel } from '@/lib/progress/levels';
import { useProgress } from '@/lib/progress/useProgress';
import { useFocusEffect } from '@react-navigation/native';

export default function PracticeHomeScreen() {
  const insets = useSafeAreaInsets();
  const [language, setLanguage] = useState<LaunchLanguage | null | undefined>(undefined);
  const { progress, progressHydrated, refresh } = useProgress();

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        const stored = await getPreferredLanguage();
        setLanguage(stored ?? DEFAULT_LAUNCH_LANGUAGE);
        await refresh();
      })();
    }, [refresh]),
  );

  const onLanguageChange = useCallback(async (lang: LaunchLanguage) => {
    setLanguage(lang);
    await setPreferredLanguage(lang);
    trackEvent('learning_path_selected', { language: lang });
  }, []);

  const effectiveLanguage = language ?? DEFAULT_LAUNCH_LANGUAGE;

  const filtered = useMemo(() => {
    return SCENARIOS.filter((s) => s.languages.includes(effectiveLanguage));
  }, [effectiveLanguage]);

  const dailyMission = useMemo(() => getDailyMission(filtered), [filtered]);
  const level = getCoachLevel(progress?.xp ?? 0);
  const completedToday = wasActiveToday(progress?.lastDay);

  const startScenario = useCallback(
    (scenarioId: (typeof SCENARIOS)[number]['id'], source: 'daily_mission' | 'scenario_library') => {
      trackEvent('scenario_selected', {
        scenario_id: scenarioId,
        mode: isVoicePracticeMode() ? 'voice' : 'text',
        learning_path: effectiveLanguage,
        source,
      });
      openScenarioPractice(scenarioId, effectiveLanguage);
    },
    [effectiveLanguage],
  );

  if (language === undefined || !progressHydrated) {
    return <ScreenLoading message="Preparing your practice…" />;
  }

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <VoxaText variant="caption" style={styles.overline}>
              Voxa Coach
            </VoxaText>
            <VoxaText variant="hero">Practice with a purpose.</VoxaText>
            <VoxaText variant="body" style={styles.intro}>
              Real conversations, small corrections, and one clear reason to speak today.
            </VoxaText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open conversation history"
            onPress={() => router.push('/(app)/history')}
            style={styles.historyHit}>
            <VoxaText variant="caption" style={styles.history}>
              History
            </VoxaText>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open progress"
          onPress={() => router.push('/(app)/(tabs)/progress')}>
          <GlassPanel style={styles.momentumStrip}>
            <View style={styles.momentumRow}>
              <View style={styles.momentumMetric}>
                <VoxaText variant="caption">Level</VoxaText>
                <VoxaText variant="lead" style={styles.metricValue}>
                  {level.current.name}
                </VoxaText>
              </View>
              <View style={styles.momentumDivider} />
              <View style={styles.momentumMetric}>
                <VoxaText variant="caption">Streak</VoxaText>
                <VoxaText variant="lead" style={styles.metricValue}>
                  {progress?.streak ?? 0}d
                </VoxaText>
              </View>
              <View style={styles.momentumDivider} />
              <View style={styles.momentumMetric}>
                <VoxaText variant="caption">XP</VoxaText>
                <VoxaText variant="lead" style={styles.metricValue}>
                  {progress?.xp ?? 0}
                </VoxaText>
              </View>
            </View>
          </GlassPanel>
        </Pressable>

        {dailyMission ? (
          <DailyCoachCard
            scenario={dailyMission}
            languageLabel={launchLanguageLabel(effectiveLanguage)}
            streak={progress?.streak ?? 0}
            completedToday={completedToday}
            onStart={() => startScenario(dailyMission.id, 'daily_mission')}
          />
        ) : null}

        <View style={styles.sectionHeader}>
          <View style={styles.sectionCopy}>
            <VoxaText variant="lead" style={styles.sectionTitle}>
              Choose your lane
            </VoxaText>
            <VoxaText variant="muted">Switch language or practice path anytime.</VoxaText>
          </View>
        </View>

        <LanguagePathPicker value={effectiveLanguage} onChange={(lang) => void onLanguageChange(lang)} />

        {!isScreenshotMode() && !isVoicePracticeMode() ? <PracticeModeFraming /> : null}
        {isScreenshotMode() ? <ScreenshotMarketingBanner /> : null}

        <View style={styles.libraryHeader}>
          <View>
            <VoxaText variant="lead" style={styles.sectionTitle}>
              Practice library
            </VoxaText>
            <VoxaText variant="caption" style={styles.pathHint}>
              {launchLanguageLabel(effectiveLanguage)} · {filtered.length} scenarios
            </VoxaText>
          </View>
          <VoxaText variant="caption" style={styles.modeLabel}>
            {isVoicePracticeMode() ? 'Live voice' : 'Text + dictation'}
          </VoxaText>
        </View>

        {filtered.length === 0 ? (
          <View style={styles.emptyBlock}>
            <PolishedEmptyState
              title="No scenarios for this path"
              body="Try another learning path above."
              compact
            />
          </View>
        ) : (
          <View style={styles.library}>
            {filtered.map((scenario) => (
              <ScenarioCard
                key={scenario.id}
                scenario={scenario}
                actionLabel={isVoicePracticeMode() ? 'Start voice practice' : 'Start practice'}
                badge={isVoicePracticeMode() ? 'Voice' : undefined}
                onPress={() => startScenario(scenario.id, 'scenario_library')}
              />
            ))}
          </View>
        )}

        {isTextPracticeMode() ? (
          <GlassPanel style={styles.voiceTeaser}>
            <VoxaText variant="caption" style={styles.voiceOverline}>
              Voice mode
            </VoxaText>
            <VoxaText variant="lead" style={styles.voiceTitle}>
              Want the pressure of a real conversation?
            </VoxaText>
            <VoxaText variant="muted">
              Voxa also supports full speech-to-speech practice when voice mode is enabled in the release build.
            </VoxaText>
          </GlassPanel>
        ) : null}

        <BetaDisclaimer compact />
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
  headerCopy: {
    flex: 1,
  },
  overline: {
    color: palette.cyan,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  intro: {
    marginTop: spacing.sm,
    maxWidth: 330,
  },
  historyHit: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginTop: 2,
  },
  history: {
    color: palette.cyan,
    fontWeight: '700',
  },
  momentumStrip: {
    marginTop: spacing.lg,
  },
  momentumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  momentumMetric: {
    flex: 1,
    gap: 2,
  },
  metricValue: {
    color: palette.textPrimary,
    fontWeight: '700',
  },
  momentumDivider: {
    width: StyleSheet.hairlineWidth,
    height: 34,
    backgroundColor: palette.frostStrong,
  },
  sectionHeader: {
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
  },
  sectionCopy: {
    gap: 2,
  },
  sectionTitle: {
    color: palette.textPrimary,
    fontWeight: '700',
  },
  libraryHeader: {
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: spacing.md,
  },
  pathHint: {
    marginTop: 2,
    opacity: 0.8,
  },
  modeLabel: {
    color: palette.cyan,
    fontWeight: '700',
  },
  emptyBlock: {
    marginTop: spacing.md,
  },
  library: {
    marginTop: spacing.xs,
  },
  voiceTeaser: {
    marginTop: spacing.sm,
  },
  voiceOverline: {
    color: palette.cyan,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
  },
  voiceTitle: {
    color: palette.textPrimary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
});
