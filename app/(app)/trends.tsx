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
import { useAuth } from '@/lib/auth/AuthContext';
import { getProgressTrendData } from '@/lib/db/conversations';
import { DEFAULT_LAUNCH_LANGUAGE, launchLanguageLabel } from '@/lib/learningPath/display';
import { getPreferredLanguage, setPreferredLanguage } from '@/lib/preferences/storage';
import {
  buildProgressTrends,
  type ProgressTrendSummary,
} from '@/lib/progress/progressTrends';
import { toApiLearningPath } from '@/lib/realtime/learningPath';
import { supabase } from '@/lib/supabase/client';

export default function TrendsScreen() {
  const insets = useSafeAreaInsets();
  const { user, initialized } = useAuth();
  const [language, setLanguage] = useState<LaunchLanguage>(DEFAULT_LAUNCH_LANGUAGE);
  const [trends, setTrends] = useState<ProgressTrendSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (selectedLanguage: LaunchLanguage) => {
      if (!user?.id) {
        setTrends(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await getProgressTrendData(
          supabase,
          user.id,
          toApiLearningPath(selectedLanguage),
          10,
        );
        setTrends(buildProgressTrends(data));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load progress trends.');
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
        await load(storedLanguage);
      })();

      return () => {
        active = false;
      };
    }, [load]),
  );

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
          <VoxaText variant="title">Sign in to see your trends.</VoxaText>
          <VoxaText variant="muted" style={styles.centerCopy}>
            Progress Trends compares completed practice history, so it needs synced sessions.
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
          Progress trends
        </VoxaText>
        <VoxaText variant="hero">See what is changing.</VoxaText>
        <VoxaText variant="body" style={styles.intro}>
          Voxa compares equally sized recent and earlier practice windows. Every statement below shows the evidence it came from.
        </VoxaText>

        <View style={styles.pathHeader}>
          <VoxaText variant="lead" style={styles.sectionTitle}>
            Practice path
          </VoxaText>
          <VoxaText variant="caption">{launchLanguageLabel(language)}</VoxaText>
        </View>
        <LanguagePathPicker
          value={language}
          onChange={(next) => {
            setLanguage(next);
            void setPreferredLanguage(next);
            void load(next);
          }}
        />

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={palette.cyan} />
            <VoxaText variant="muted">Comparing recent and earlier practice…</VoxaText>
          </View>
        ) : null}

        {error ? (
          <GlassPanel style={styles.errorCard}>
            <VoxaText variant="body">{error}</VoxaText>
            <VoxaButton
              title="Retry"
              onPress={() => void load(language)}
              containerStyle={styles.retry}
            />
          </GlassPanel>
        ) : null}

        {!loading && !error && trends ? (
          <>
            <GlassPanel style={styles.summaryCard} intensity={34}>
              <VoxaText variant="caption" style={styles.summaryOverline}>
                Comparison window
              </VoxaText>
              <VoxaText variant="title">{trends.headline}</VoxaText>
              <VoxaText variant="body" style={styles.summaryCopy}>
                {trends.summary}
              </VoxaText>
              <View style={styles.windowRow}>
                <View style={styles.windowTile}>
                  <VoxaText variant="lead" style={styles.windowValue}>
                    {trends.windowSize}
                  </VoxaText>
                  <VoxaText variant="caption">recent sessions</VoxaText>
                </View>
                <View style={styles.windowTile}>
                  <VoxaText variant="lead" style={styles.windowValue}>
                    {trends.windowSize}
                  </VoxaText>
                  <VoxaText variant="caption">earlier sessions</VoxaText>
                </View>
              </View>
            </GlassPanel>

            {!trends.ready ? (
              <GlassPanel style={styles.emptyCard}>
                <VoxaText variant="lead" style={styles.cardTitle}>
                  More history needed
                </VoxaText>
                <VoxaText variant="muted">
                  {trends.sessionsAvailable} completed sessions are available on this path. Voxa starts comparing once it can build two equal windows of at least three sessions.
                </VoxaText>
              </GlassPanel>
            ) : (
              <View style={styles.trendList}>
                {trends.items.map((item) => (
                  <GlassPanel key={item.id} style={styles.trendCard}>
                    <VoxaText variant="caption" style={styles.itemLabel}>
                      {item.eyebrow}
                    </VoxaText>
                    <VoxaText variant="title" style={styles.itemTitle}>
                      {item.title}
                    </VoxaText>
                    <VoxaText variant="body" style={styles.detail}>
                      {item.detail}
                    </VoxaText>

                    <View style={styles.compare}>
                      <View style={styles.compareTile}>
                        <VoxaText variant="caption" style={styles.compareLabel}>
                          Recent
                        </VoxaText>
                        <VoxaText variant="lead" style={styles.recentValue}>
                          {item.recentLabel}
                        </VoxaText>
                      </View>
                      <View style={styles.compareTile}>
                        <VoxaText variant="caption" style={styles.compareLabel}>
                          Earlier
                        </VoxaText>
                        <VoxaText variant="lead">
                          {item.earlierLabel}
                        </VoxaText>
                      </View>
                    </View>
                  </GlassPanel>
                ))}
              </View>
            )}

            {trends.ready &&
            (trends.recentReviewedCount < 2 || trends.earlierReviewedCount < 2) ? (
              <GlassPanel style={styles.methodCard}>
                <VoxaText variant="caption" style={styles.summaryOverline}>
                  Skill trends are still unlocking
                </VoxaText>
                <VoxaText variant="muted">
                  Older practice happened before Voxa started saving structured Coach Recaps. Range, correction activity, and difficulty can still be compared now; focus and strength trends will appear as newer reviewed sessions accumulate.
                </VoxaText>
              </GlassPanel>
            ) : null}
          </>
        ) : null}

        <GlassPanel style={styles.methodCard}>
          <VoxaText variant="caption" style={styles.summaryOverline}>
            What these trends mean
          </VoxaText>
          <VoxaText variant="muted">
            Trends describe what appeared in saved sessions. They are not grades, language-proficiency tests, or guarantees that a skill has permanently improved. Scenario mix and practice difficulty can change the amount of coaching you receive.
          </VoxaText>
        </GlassPanel>

        <BetaDisclaimer compact />
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.xl },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  centerCopy: { textAlign: 'center', maxWidth: 330 },
  overline: {
    color: palette.cyan,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  intro: { marginTop: spacing.sm, maxWidth: 360 },
  pathHeader: {
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: spacing.md,
  },
  sectionTitle: { color: palette.textPrimary, fontWeight: '700' },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  errorCard: { marginTop: spacing.lg },
  retry: { marginTop: spacing.md },
  summaryCard: { marginTop: spacing.xl, borderRadius: radii.xl },
  summaryOverline: {
    color: palette.cyan,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  summaryCopy: { marginTop: spacing.sm },
  windowRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  windowTile: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.frostStrong,
    backgroundColor: palette.frost,
  },
  windowValue: { color: palette.textPrimary, fontWeight: '800' },
  emptyCard: { marginTop: spacing.lg },
  cardTitle: { color: palette.textPrimary, fontWeight: '700', marginBottom: spacing.xs },
  trendList: { marginTop: spacing.xl, gap: spacing.md },
  trendCard: { borderRadius: radii.lg },
  itemLabel: {
    color: palette.cyan,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    fontWeight: '700',
  },
  itemTitle: { color: palette.textPrimary, marginTop: 3 },
  detail: { marginTop: spacing.sm },
  compare: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  compareTile: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.frostStrong,
    backgroundColor: palette.frost,
  },
  compareLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  recentValue: { color: palette.cyan },
  methodCard: { marginTop: spacing.xl, borderRadius: radii.lg },
});
