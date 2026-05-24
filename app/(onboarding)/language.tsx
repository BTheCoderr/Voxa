import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { TabletContent } from '@/components/layout/TabletContent';
import { BetaDisclaimer } from '@/components/ui/BetaDisclaimer';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { VoxaButton } from '@/components/ui/VoxaButton';
import { VoxaText } from '@/components/ui/VoxaText';
import type { LaunchLanguage } from '@/constants/scenarios';
import { LAUNCH_LANGUAGES } from '@/constants/scenarios';
import { palette, radii, spacing } from '@/constants/theme';
import { setPreferredLanguage } from '@/lib/preferences/storage';

export default function LanguageScreen() {
  const [selected, setSelected] = useState<LaunchLanguage | null>(null);

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TabletContent fullWidth>
          <View style={styles.header}>
            <VoxaText variant="caption" style={styles.overline}>
              Step 1 of 3
            </VoxaText>
            <VoxaText variant="title">Choose your focus language</VoxaText>
            <VoxaText variant="body">We will tune scenarios, prompts, and feedback for this track.</VoxaText>
          </View>

          <View style={styles.list}>
            {LAUNCH_LANGUAGES.map((lang) => {
              const active = selected === lang.id;
              return (
                <Pressable key={lang.id} onPress={() => setSelected(lang.id)} style={styles.row}>
                  <GlassPanel
                    style={[
                      styles.card,
                      active && {
                        borderColor: palette.electricBlue,
                        borderWidth: 1,
                      },
                    ]}>
                    <VoxaText variant="title" style={styles.langTitle}>
                      {lang.label}
                    </VoxaText>
                    <VoxaText variant="muted">{lang.hint}</VoxaText>
                  </GlassPanel>
                </Pressable>
              );
            })}
          </View>

          <VoxaButton
            title="Continue"
            disabled={!selected}
            onPress={async () => {
              if (!selected) return;
              await setPreferredLanguage(selected);
              router.push('/(onboarding)/goals');
            }}
          />
          <BetaDisclaimer compact />
        </TabletContent>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
    flexGrow: 1,
  },
  header: {
    gap: spacing.sm,
  },
  overline: {
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  list: {
    gap: spacing.sm,
  },
  row: {
    borderRadius: radii.lg,
  },
  card: {
    borderRadius: radii.lg,
  },
  langTitle: {
    marginBottom: spacing.xs,
    fontSize: 18,
  },
});
