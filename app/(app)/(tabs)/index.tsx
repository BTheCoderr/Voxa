import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenshotMarketingBanner } from '@/components/marketing/ScreenshotMarketingBanner';
import { PolishedEmptyState } from '@/components/marketing/PolishedEmptyState';
import { ComebackNudgeCard } from '@/components/practice/ComebackNudgeCard';
import { DailyCoachCard } from '@/components/practice/DailyCoachCard';
import { PracticeLevelPicker } from '@/components/practice/PracticeLevelPicker';
import { WeeklyCoachPlanCard } from '@/components/progress/WeeklyCoachPlanCard';
import { LanguagePathPicker } from '@/components/practice/LanguagePathPicker';
import { PracticeModeFraming } from '@/components/practice/PracticeModeFraming';
import { ScenarioCard } from '@/components/scenario/ScenarioCard';
import { BetaDisclaimer } from '@/components/ui/BetaDisclaimer';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { ScreenLoading } from '@/components/ui/ScreenStates';
import { VoxaText } from '@/components/ui/VoxaText';
import { getScenario, SCENARIOS, type LaunchLanguage, type ScenarioId } from '@/constants/scenarios';
import { palette, spacing } from '@/constants/theme';
import { trackEvent } from '@/lib/analytics/track';
import { openScenarioPractice } from '@/lib/ai/openPractice';
import { useAuth } from '@/lib/auth/AuthContext';
import { getRecentReviewedConversations } from '@/lib/db/conversations';
import { isTextPracticeMode, isVoicePracticeMode } from '@/lib/ai/mode';
import { DEFAULT_LAUNCH_LANGUAGE, launchLanguageLabel } from '@/lib/learningPath/display';
import { isScreenshotMode } from '@/lib/presentation/screenshotMode';
import {
  getPreferredLanguage,
  getPreferredLevel,
  setPreferredLanguage,
  setPreferredLevel,
} from '@/lib/preferences/storage';
import {
  buildMissionFromCoachMemory,
  loadPersonalizedMission,
  type PersonalizedMission,
} from '@/lib/practice/coachPlan';
import {
  buildComebackNudge,
  dismissComebackNudgeToday,
  isComebackNudgeDismissedToday,
  type ComebackNudge,
} from '@/lib/practice/comeback';
import { getDailyMission, wasActiveToday } from '@/lib/practice/dailyMission';
import { buildLearnerCoachMemory } from '@/lib/progress/coachMemory';
import { practiceLevelLabel } from '@/lib/progress/adaptiveDifficulty';
import { getCoachLevel } from '@/lib/progress/levels';
import {
  loadWeeklyCoachPlan,
  type WeeklyCoachPlan,
  type WeeklyCoachPlanItem,
} from '@/lib/progress/weeklyCoachPlan';
import { useProgress } from '@/lib/progress/useProgress';
import { toApiLearningPath } from '@/lib/realtime/learningPath';
import { supabase } from '@/lib/supabase/client';
import type { UserLevel } from '@/lib/realtime/types';
import { useFocusEffect } from '@react-navigation/native';

export default function PracticeHomeScreen() {
  const insets = useSafeAreaInsets();
  const [language, setLanguage] = useState<LaunchLanguage | null | undefined>(undefined);
  const [personalizedMission, setPersonalizedMission] = useState<PersonalizedMission | null>(null);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyCoachPlan | null>(null);
  const [practiceLevel, setPracticeLevel] = useState<UserLevel>('intermediate');
  const [visibleComebackNudge, setVisibleComebackNudge] =
    useState<ComebackNudge | null>(null);
  const { user } = useAuth();
  const { progress, progressHydrated, refresh } = useProgress();

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        const [stored, localPlan] = await Promise.all([
          getPreferredLanguage(),
          loadPersonalizedMission(),
        ]);
        const selectedLanguage = stored ?? DEFAULT_LAUNCH_LANGUAGE;
        const selectedLevel = await getPreferredLevel(selectedLanguage);
        let resolvedPlan = localPlan;

        if (user) {
          try {
            const learningPath = toApiLearningPath(selectedLanguage);
            const [rows, loadedWeeklyPlan] = await Promise.all([
              getRecentReviewedConversations(
                supabase,
                user.id,
                learningPath,
                10,
              ),
              loadWeeklyCoachPlan(
                supabase,
                user.id,
                learningPath,
              ),
            ]);
            if (!resolvedPlan) {
              resolvedPlan = buildMissionFromCoachMemory(buildLearnerCoachMemory(rows));
            }
            setWeeklyPlan(loadedWeeklyPlan);
          } catch (error) {
            console.warn('loadCloudCoaching', error);
            setWeeklyPlan(null);
          }
        } else {
          setWeeklyPlan(null);
        }

        setLanguage(selectedLanguage);
        setPracticeLevel(selectedLevel);
        setPersonalizedMission(resolvedPlan);
        await refresh();
      })();
    }, [refresh, user?.id]),
  );

  const onLanguageChange = useCallback(async (lang: LaunchLanguage) => {
    setLanguage(lang);
    const nextLevel = await getPreferredLevel(lang);
    setPracticeLevel(nextLevel);
    await setPreferredLanguage(lang);
    trackEvent('learning_path_selected', { language: lang });

    if (!user) {
      setWeeklyPlan(null);
      return;
    }

    try {
      setWeeklyPlan(
        await loadWeeklyCoachPlan(
          supabase,
          user.id,
          toApiLearningPath(lang),
        ),
      );
    } catch (error) {
      console.warn('loadWeeklyCoachPlanAfterPathChange', error);
      setWeeklyPlan(null);
    }
  }, [user?.id]);

  const effectiveLanguage = language ?? DEFAULT_LAUNCH_LANGUAGE;

  const filtered = useMemo(() => {
    return SCENARIOS.filter((s) => s.languages.includes(effectiveLanguage));
  }, [effectiveLanguage]);

  const dailyMission = useMemo(() => getDailyMission(filtered), [filtered]);
  const personalizedScenario = useMemo(() => {
    if (!personalizedMission) return null;
    const scenario = getScenario(personalizedMission.scenarioId as ScenarioId);
    if (!scenario || !scenario.languages.includes(effectiveLanguage)) return null;
    return scenario;
  }, [effectiveLanguage, personalizedMission]);
  const coachMission = personalizedScenario ?? dailyMission;
  const level = getCoachLevel(progress?.xp ?? 0);
  const completedToday = wasActiveToday(progress?.lastDay);

  const comebackCandidate = useMemo(
    () =>
      buildComebackNudge({
        weeklyPlan,
        streak: progress?.streak ?? 0,
        lastActivityDay: progress?.lastDay,
        fallbackScenarioId: coachMission?.id ?? null,
      }),
    [coachMission?.id, progress?.lastDay, progress?.streak, weeklyPlan],
  );

  useEffect(() => {
    let active = true;

    void (async () => {
      if (!comebackCandidate) {
        if (active) setVisibleComebackNudge(null);
        return;
      }

      const dismissed = await isComebackNudgeDismissedToday(comebackCandidate);
      if (!active) return;
      setVisibleComebackNudge(dismissed ? null : comebackCandidate);
    })();

    return () => {
      active = false;
    };
  }, [comebackCandidate]);

  const startScenario = useCallback(
    (
      scenarioId: (typeof SCENARIOS)[number]['id'],
      source: 'daily_mission' | 'scenario_library' | 'coach_recommendation',
    ) => {
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
                <VoxaText variant="caption">Coach stage</VoxaText>
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

        {visibleComebackNudge ? (
          <ComebackNudgeCard
            nudge={visibleComebackNudge}
            onStart={() => {
              trackEvent('comeback_nudge_started', {
                kind: visibleComebackNudge.kind,
                scenario_id: visibleComebackNudge.scenarioId,
                week_key: visibleComebackNudge.weekKey,
                learning_path: effectiveLanguage,
              });
              openScenarioPractice(
                visibleComebackNudge.scenarioId,
                effectiveLanguage,
                {
                  focus: visibleComebackNudge.focus,
                  mission: visibleComebackNudge.mission,
                },
              );
            }}
            onDismiss={() => {
              trackEvent('comeback_nudge_dismissed', {
                kind: visibleComebackNudge.kind,
                week_key: visibleComebackNudge.weekKey,
                learning_path: effectiveLanguage,
              });
              void dismissComebackNudgeToday(visibleComebackNudge);
              setVisibleComebackNudge(null);
            }}
          />
        ) : null}

        {coachMission ? (
          <DailyCoachCard
            scenario={coachMission}
            languageLabel={launchLanguageLabel(effectiveLanguage)}
            streak={progress?.streak ?? 0}
            completedToday={completedToday}
            personalizedMission={personalizedScenario ? personalizedMission : null}
            onStart={() =>
              startScenario(
                coachMission.id,
                personalizedScenario ? 'coach_recommendation' : 'daily_mission',
              )
            }
          />
        ) : null}

        {user && weeklyPlan ? (
          <View style={styles.weeklyPlanWrap}>
            <WeeklyCoachPlanCard
              plan={weeklyPlan}
              languageLabel={launchLanguageLabel(effectiveLanguage)}
              levelLabel={practiceLevelLabel(practiceLevel)}
              onStart={(item: WeeklyCoachPlanItem) => {
                trackEvent('weekly_coach_plan_started', {
                  scenario_id: item.scenarioId,
                  source: item.source,
                  week_key: weeklyPlan.weekKey,
                  learning_path: effectiveLanguage,
                });
                openScenarioPractice(item.scenarioId, effectiveLanguage, {
                  focus: item.focus,
                  mission: item.mission,
                });
              }}
            />
          </View>
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

        <View style={styles.difficultyBlock}>
          <View style={styles.difficultyHeader}>
            <VoxaText variant="lead" style={styles.sectionTitle}>
              Practice difficulty
            </VoxaText>
            <VoxaText variant="caption" style={styles.modeLabel}>
              {practiceLevelLabel(practiceLevel)}
            </VoxaText>
          </View>
          <PracticeLevelPicker
            value={practiceLevel}
            onChange={(nextLevel) => {
              setPracticeLevel(nextLevel);
              void setPreferredLevel(effectiveLanguage, nextLevel);
              trackEvent('practice_level_selected', {
                learning_path: effectiveLanguage,
                level: nextLevel,
                source: 'practice_home',
              });
            }}
            showDescriptions
          />
        </View>

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
  weeklyPlanWrap: {
    marginTop: spacing.xxl,
  },
  difficultyBlock: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  difficultyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
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
