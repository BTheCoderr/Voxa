import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScenarioCard } from '@/components/scenario/ScenarioCard';
import { ScreenshotMarketingBanner } from '@/components/marketing/ScreenshotMarketingBanner';
import { PolishedEmptyState } from '@/components/marketing/PolishedEmptyState';
import { BetaDisclaimer } from '@/components/ui/BetaDisclaimer';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { ScreenLoading } from '@/components/ui/ScreenStates';
import { VoxaText } from '@/components/ui/VoxaText';
import { SCENARIOS, type LaunchLanguage } from '@/constants/scenarios';
import { spacing } from '@/constants/theme';
import { trackEvent } from '@/lib/analytics/track';
import { isScreenshotMode } from '@/lib/presentation/screenshotMode';
import { getPreferredLanguage } from '@/lib/preferences/storage';
import { useFocusEffect } from '@react-navigation/native';

export default function ScenariosHomeScreen() {
  const insets = useSafeAreaInsets();
  const [language, setLanguage] = useState<LaunchLanguage | null | undefined>(undefined);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        setLanguage(await getPreferredLanguage());
      })();
    }, []),
  );

  const filtered = useMemo(() => {
    if (language == null) return [];
    if (!language) return SCENARIOS;
    return SCENARIOS.filter((s) => s.languages.includes(language));
  }, [language]);

  if (language === undefined) {
    return <ScreenLoading message="Loading scenarios…" />;
  }

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <VoxaText variant="caption" style={styles.overline}>
              TestFlight beta
            </VoxaText>
            <VoxaText variant="title">Choose a scenario</VoxaText>
            <VoxaText variant="body">Pick something small. Speak out loud — we will keep it human and calm.</VoxaText>
            <BetaDisclaimer compact />
          </View>
          <Pressable onPress={() => router.push('/(app)/history')} style={styles.historyHit}>
            <VoxaText variant="caption" style={styles.history}>
              History
            </VoxaText>
          </Pressable>
        </View>

        {isScreenshotMode() ? <ScreenshotMarketingBanner /> : null}

        {filtered.length === 0 ? (
          <View style={styles.emptyBlock}>
            <PolishedEmptyState
              title="No scenarios match this track"
              body="Your focus language may filter the list during beta. Re-run onboarding to change language, or contact us if this persists."
              footnote="Tip: clearing app data resets onboarding on test devices."
              compact
            />
          </View>
        ) : (
          <View style={{ marginTop: spacing.lg }}>
            {filtered.map((scenario) => (
              <ScenarioCard
                key={scenario.id}
                scenario={scenario}
                onPress={() => {
                  trackEvent('scenario_selected', { scenario_id: scenario.id });
                  router.push(`/(app)/conversation/${scenario.id}`);
                }}
              />
            ))}
          </View>
        )}
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
});
