import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LanguagePathPicker } from '@/components/practice/LanguagePathPicker';
import { PracticeModeFraming } from '@/components/practice/PracticeModeFraming';
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
import { openScenarioPractice } from '@/lib/ai/openPractice';
import { isTextPracticeMode, isVoicePracticeMode } from '@/lib/ai/mode';
import { DEFAULT_LAUNCH_LANGUAGE, launchLanguageLabel } from '@/lib/learningPath/display';
import { isScreenshotMode } from '@/lib/presentation/screenshotMode';
import { getPreferredLanguage, setPreferredLanguage } from '@/lib/preferences/storage';
import { useFocusEffect } from '@react-navigation/native';

export default function ScenariosHomeScreen() {
  const insets = useSafeAreaInsets();
  const [language, setLanguage] = useState<LaunchLanguage | null | undefined>(undefined);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        const stored = await getPreferredLanguage();
        setLanguage(stored ?? DEFAULT_LAUNCH_LANGUAGE);
      })();
    }, []),
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
              {isVoicePracticeMode() ? 'Live voice · Premium' : 'Text practice · Low cost'}
            </VoxaText>
            <VoxaText variant="title">Choose a scenario</VoxaText>
            <VoxaText variant="body">
              {isVoicePracticeMode()
                ? 'Live voice practice — speak out loud. Experimental premium mode.'
                : 'Start with text practice. Type or dictate — AI replies in text with gentle corrections.'}
            </VoxaText>
            <BetaDisclaimer compact />
          </View>
          <Pressable onPress={() => router.push('/(app)/history')} style={styles.historyHit}>
            <VoxaText variant="caption" style={styles.history}>
              History
            </VoxaText>
          </Pressable>
        </View>

        <LanguagePathPicker value={effectiveLanguage} onChange={(lang) => void onLanguageChange(lang)} />

        <VoxaText variant="caption" style={styles.pathHint}>
          Practicing · {launchLanguageLabel(effectiveLanguage)}
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
