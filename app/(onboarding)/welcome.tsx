import { router } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabletContent } from '@/components/layout/TabletContent';
import { VoiceWaveDecoration } from '@/components/marketing/VoiceWaveDecoration';
import { VoxaOrb } from '@/components/onboarding/VoxaOrb';
import { BetaDisclaimer } from '@/components/ui/BetaDisclaimer';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { VoxaButton } from '@/components/ui/VoxaButton';
import { VoxaText } from '@/components/ui/VoxaText';
import { spacing } from '@/constants/theme';
import { trackEvent } from '@/lib/analytics/track';

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    trackEvent('onboarding_started');
  }, []);

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + spacing.xxl,
            paddingBottom: insets.bottom + spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        <TabletContent fullWidth>
          <View style={styles.heroBlock}>
            <VoxaOrb size={72} />
            <VoiceWaveDecoration compact />
          </View>

          <VoxaText variant="caption" style={styles.overline}>
            Voxa · AI language coach
          </VoxaText>
          <VoxaText variant="hero">Speak naturally with AI.</VoxaText>
          <VoxaText variant="lead">
            Practice real conversations in Business English, Spanish, and Mandarin.
          </VoxaText>

          <BetaDisclaimer compact />

          <VoxaButton
            title="Start practicing"
            onPress={() => router.push('/(onboarding)/language')}
            containerStyle={styles.ctaPrimary}
          />
          <VoxaButton
            title="I already have an account"
            variant="ghost"
            onPress={() => router.push('/(auth)/sign-in')}
            containerStyle={styles.ctaSecondary}
          />

          <VoxaText variant="muted" style={styles.footer}>
            Short daily sessions · Supportive corrections · Voice playback is manual
          </VoxaText>
        </TabletContent>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
  },
  heroBlock: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  overline: {
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  ctaPrimary: {
    marginTop: spacing.xl,
  },
  ctaSecondary: {
    marginTop: spacing.sm,
  },
  footer: {
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 20,
  },
});
