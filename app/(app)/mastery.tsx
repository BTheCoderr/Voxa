import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LanguagePathPicker } from '@/components/practice/LanguagePathPicker';
import { BetaDisclaimer } from '@/components/ui/BetaDisclaimer';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { VoxaButton } from '@/components/ui/VoxaButton';
import { VoxaText } from '@/components/ui/VoxaText';
import type { LaunchLanguage } from '@/constants/scenarios';
import { palette, radii, spacing } from '@/constants/theme';
import { openScenarioPractice } from '@/lib/ai/openPractice';
import { trackEvent } from '@/lib/analytics/track';
import { useAuth } from '@/lib/auth/AuthContext';
import { getCorrectionMasteryData } from '@/lib/db/conversations';
import { DEFAULT_LAUNCH_LANGUAGE, launchLanguageLabel } from '@/lib/learningPath/display';
import { getPreferredLanguage, setPreferredLanguage } from '@/lib/preferences/storage';
import {
  buildCorrectionMastery,
  type CorrectionMasteryPattern,
  type CorrectionMasteryStatus,
  type CorrectionMasterySummary,
} from '@/lib/progress/correctionMastery';
import { toApiLearningPath, fromApiLearningPath } from '@/lib/realtime/learningPath';
import { supabase } from '@/lib/supabase/client';

function statusLabel(status: CorrectionMasteryStatus): string {
  switch (status) {
    case 'recurring':
      return 'Needs another rep';
    case 'improving':
      return 'Improving';
    case 'mastered':
      return 'Mastered for now';
    case 'new':
    default:
      return 'New correction';
  }
}

function formatSeen(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function CorrectionMasteryScreen() {
  const insets = useSafeAreaInsets();
  const { user, initialized } = useAuth();
  const [language, setLanguage] = useState<LaunchLanguage>(DEFAULT_LAUNCH_LANGUAGE);
  const [mastery, setMastery] = useState<CorrectionMasterySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadForLanguage = useCallback(
    async (selectedLanguage: LaunchLanguage) => {
      if (!user?.id) {
        setMastery(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await getCorrectionMasteryData(
          supabase,
          user.id,
          toApiLearningPath(selectedLanguage),
          30,
        );
        setMastery(buildCorrectionMastery(data));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load correction mastery.');
      } finally {
        setLoading(false);
      }
    },
    [user?.id],
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;

      void (async () => {
        const storedLanguage = (await getPreferredLanguage()) ?? DEFAULT_LAUNCH_LANGUAGE;
        if (!active) return;
        setLanguage(storedLanguage);
        await loadForLanguage(storedLanguage);
      })();

      return () => {
        active = false;
      };
    }, [loadForLanguage]),
  );

  const onLanguageChange = useCallback(
    async (nextLanguage: LaunchLanguage) => {
      setLanguage(nextLanguage);
      await setPreferredLanguage(nextLanguage);
      trackEvent('correction_mastery_path_changed', { language: nextLanguage });
      await loadForLanguage(nextLanguage);
    },
    [loadForLanguage],
  );

  const practicePattern = useCallback((pattern: CorrectionMasteryPattern) => {
    trackEvent('correction_mastery_practice', {
      status: pattern.status,
      session_count: pattern.sessionCount,
      scenario_id: pattern.scenarioId,
      learning_path: pattern.learningPath,
    });

    openScenarioPractice(
      pattern.scenarioId,
      fromApiLearningPath(pattern.learningPath),
      {
        focus: pattern.focus,
        mission: pattern.mission,
      },
    );
  }, []);

  if (!initialized) {
    return (
      <GradientBackground>
        <View style={styles.center}>
          <ActivityIndicator color={palette.cyan} />
        </View>
      </GradientBackground>
    );
  }

  if (!user) {
    return (
      <GradientBackground>
        <View style={[styles.center, { paddingHorizontal: spacing.xl }]}>
          <VoxaText variant="title">Sign in to build mastery.</VoxaText>
          <VoxaText variant="muted" style={styles.centerCopy}>
            Correction Mastery compares your saved coaching notes across sessions, so it needs synced practice history.
          </VoxaText>
          <VoxaButton
            title="Go to profile"
            onPress={() => router.replace('/(app)/(tabs)/profile')}
          />
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}>
        <VoxaText variant="caption" style={styles.overline}>
          Correction mastery
        </VoxaText>
        <VoxaText variant="hero">Things you’re mastering.</VoxaText>
        <VoxaText variant="body" style={styles.intro}>
          Voxa separates one-off corrections from patterns, then watches whether those patterns keep coming back.
        </VoxaText>

        <View style={styles.pathHeader}>
          <VoxaText variant="lead" style={styles.sectionTitle}>
            Practice path
          </VoxaText>
          <VoxaText variant="caption">{launchLanguageLabel(language)}</VoxaText>
        </View>
        <LanguagePathPicker
          value={language}
          onChange={(next) => void onLanguageChange(next)}
        />

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={palette.cyan} />
            <VoxaText variant="muted">Reading your correction history…</VoxaText>
          </View>
        ) : null}

        {error ? (
          <GlassPanel style={styles.errorCard}>
            <VoxaText variant="body">{error}</VoxaText>
            <VoxaButton
              title="Retry"
              onPress={() => void loadForLanguage(language)}
              containerStyle={styles.retry}
            />
          </GlassPanel>
        ) : null}

        {!loading && !error && mastery ? (
          <>
            <GlassPanel style={styles.summaryCard} intensity={34}>
              <VoxaText variant="caption" style={styles.summaryOverline}>
                Your correction pattern
              </VoxaText>
              <VoxaText variant="title">{mastery.headline}</VoxaText>
              <VoxaText variant="body" style={styles.summaryCopy}>
                {mastery.summary}
              </VoxaText>

              <View style={styles.metrics}>
                <Metric label="Needs reps" value={mastery.recurringCount} />
                <Metric label="Improving" value={mastery.improvingCount} />
                <Metric label="Mastered" value={mastery.masteredCount} />
              </View>
            </GlassPanel>

            {mastery.patterns.length === 0 ? (
              <GlassPanel style={styles.emptyCard}>
                <VoxaText variant="lead" style={styles.cardTitle}>
                  Nothing to track yet
                </VoxaText>
                <VoxaText variant="muted">
                  Finish coached sessions and save a few corrections. Voxa will start separating one-off notes from recurring patterns automatically.
                </VoxaText>
              </GlassPanel>
            ) : (
              <>
                <MasterySection
                  title="Needs another rep"
                  subtitle="Corrections that have resurfaced across more than one session."
                  patterns={mastery.patterns.filter((pattern) => pattern.status === 'recurring')}
                  onPractice={practicePattern}
                />
                <MasterySection
                  title="New corrections"
                  subtitle="Seen once so far. Voxa is watching before calling these patterns."
                  patterns={mastery.patterns.filter((pattern) => pattern.status === 'new')}
                  onPractice={practicePattern}
                />
                <MasterySection
                  title="Improving"
                  subtitle="Recurring before, but absent from at least two later completed sessions."
                  patterns={mastery.patterns.filter((pattern) => pattern.status === 'improving')}
                  onPractice={practicePattern}
                />
                <MasterySection
                  title="Mastered for now"
                  subtitle="Previously recurring, then absent from at least four later completed sessions."
                  patterns={mastery.patterns.filter((pattern) => pattern.status === 'mastered')}
                  onPractice={practicePattern}
                />
              </>
            )}
          </>
        ) : null}

        <GlassPanel style={styles.methodCard}>
          <VoxaText variant="caption" style={styles.summaryOverline}>
            How Voxa decides
          </VoxaText>
          <VoxaText variant="muted">
            Similar correction phrases are grouped conservatively. “Mastered” means a recurring correction has stopped appearing across several later completed sessions—not that the skill can never slip again.
          </VoxaText>
        </GlassPanel>

        <BetaDisclaimer compact />
      </ScrollView>
    </GradientBackground>
  );
}

function MasterySection({
  title,
  subtitle,
  patterns,
  onPractice,
}: {
  title: string;
  subtitle: string;
  patterns: CorrectionMasteryPattern[];
  onPractice: (pattern: CorrectionMasteryPattern) => void;
}) {
  if (patterns.length === 0) return null;

  return (
    <View style={styles.section}>
      <VoxaText variant="lead" style={styles.sectionTitle}>
        {title}
      </VoxaText>
      <VoxaText variant="muted" style={styles.sectionSubtitle}>
        {subtitle}
      </VoxaText>

      <View style={styles.patternList}>
        {patterns.map((pattern) => (
          <PatternCard key={pattern.id} pattern={pattern} onPractice={onPractice} />
        ))}
      </View>
    </View>
  );
}

function PatternCard({
  pattern,
  onPractice,
}: {
  pattern: CorrectionMasteryPattern;
  onPractice: (pattern: CorrectionMasteryPattern) => void;
}) {
  return (
    <GlassPanel style={styles.patternCard}>
      <View style={styles.patternTop}>
        <View style={styles.patternCopy}>
          <VoxaText variant="caption" style={styles.statusLabel}>
            {statusLabel(pattern.status)}
          </VoxaText>
          <VoxaText variant="lead" style={styles.targetPhrase}>
            {pattern.targetPhrase}
          </VoxaText>
        </View>
        <View style={styles.sessionPill}>
          <VoxaText variant="caption" style={styles.sessionPillText}>
            {pattern.sessionCount} {pattern.sessionCount === 1 ? 'session' : 'sessions'}
          </VoxaText>
        </View>
      </View>

      {pattern.originalPhrase ? (
        <View style={styles.beforeAfter}>
          <VoxaText variant="caption" style={styles.beforeLabel}>
            Before
          </VoxaText>
          <VoxaText variant="muted" style={styles.originalPhrase}>
            {pattern.originalPhrase}
          </VoxaText>
        </View>
      ) : null}

      {pattern.explanation ? (
        <VoxaText variant="body" style={styles.explanation}>
          {pattern.explanation}
        </VoxaText>
      ) : null}

      <View style={styles.evidenceBox}>
        <VoxaText variant="caption" style={styles.evidenceLabel}>
          Why this status
        </VoxaText>
        <VoxaText variant="muted">{pattern.evidence}</VoxaText>
      </View>

      <View style={styles.metaRow}>
        <VoxaText variant="caption">{pattern.scenarioTitle}</VoxaText>
        <VoxaText variant="caption">Last seen {formatSeen(pattern.lastSeenAt)}</VoxaText>
      </View>

      <VoxaButton
        title={pattern.status === 'mastered' ? 'Reinforce this' : 'Practice this'}
        variant={pattern.status === 'mastered' ? 'ghost' : 'primary'}
        onPress={() => onPractice(pattern)}
        containerStyle={styles.practiceButton}
      />
    </GlassPanel>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.metric}>
      <VoxaText variant="title" style={styles.metricValue}>
        {value}
      </VoxaText>
      <VoxaText variant="caption">{label}</VoxaText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  centerCopy: {
    textAlign: 'center',
    maxWidth: 330,
  },
  overline: {
    color: palette.cyan,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  intro: {
    marginTop: spacing.sm,
    maxWidth: 350,
  },
  pathHeader: {
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: spacing.md,
  },
  sectionTitle: {
    color: palette.textPrimary,
    fontWeight: '700',
  },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  errorCard: {
    marginTop: spacing.lg,
  },
  retry: {
    marginTop: spacing.md,
  },
  summaryCard: {
    marginTop: spacing.xl,
    borderRadius: radii.xl,
  },
  summaryOverline: {
    color: palette.cyan,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    marginBottom: spacing.xs,
  },
  summaryCopy: {
    marginTop: spacing.sm,
  },
  metrics: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  metric: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.frostStrong,
    backgroundColor: palette.frost,
  },
  metricValue: {
    color: palette.textPrimary,
  },
  emptyCard: {
    marginTop: spacing.xl,
  },
  cardTitle: {
    color: palette.textPrimary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  section: {
    marginTop: spacing.xxl,
  },
  sectionSubtitle: {
    marginTop: 3,
  },
  patternList: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  patternCard: {
    borderRadius: radii.lg,
  },
  patternTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  patternCopy: {
    flex: 1,
  },
  statusLabel: {
    color: palette.cyan,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    fontWeight: '700',
    marginBottom: 3,
  },
  targetPhrase: {
    color: palette.textPrimary,
    fontWeight: '700',
  },
  sessionPill: {
    borderRadius: radii.full,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.frostStrong,
    backgroundColor: palette.frost,
  },
  sessionPillText: {
    fontWeight: '700',
  },
  beforeAfter: {
    marginTop: spacing.md,
    gap: 2,
  },
  beforeLabel: {
    color: palette.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  originalPhrase: {
    textDecorationLine: 'line-through',
  },
  explanation: {
    marginTop: spacing.md,
  },
  evidenceBox: {
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: palette.frost,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.frostStrong,
    gap: 3,
  },
  evidenceLabel: {
    color: palette.cyan,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  metaRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  practiceButton: {
    marginTop: spacing.md,
  },
  methodCard: {
    marginTop: spacing.xxl,
    borderRadius: radii.lg,
  },
});
