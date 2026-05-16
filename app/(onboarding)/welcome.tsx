import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { BetaDisclaimer } from '@/components/ui/BetaDisclaimer';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { VoxaButton } from '@/components/ui/VoxaButton';
import { VoxaText } from '@/components/ui/VoxaText';
import { spacing } from '@/constants/theme';

import { trackEvent } from '@/lib/analytics/track';

export default function WelcomeScreen() {
  useEffect(() => {
    trackEvent('onboarding_started');
  }, []);
  return (
    <GradientBackground>
      <View style={styles.container}>
        <View style={styles.copy}>
          <VoxaText variant="caption" style={styles.overline}>
            Voxa
          </VoxaText>
          <VoxaText variant="hero">Practice real conversations with AI.</VoxaText>
          <VoxaText variant="lead">
            Build speaking confidence for work, travel, and life — with calm, realistic scenarios that feel like the real world.
          </VoxaText>
        </View>

        <VoxaButton title="Begin" onPress={() => router.push('/(onboarding)/language')} containerStyle={styles.cta} />
        <BetaDisclaimer compact />
        <VoxaText variant="muted" style={styles.disclaimer}>
          Short daily sessions. Supportive corrections. No judgment — just steady progress.
        </VoxaText>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    justifyContent: 'space-between',
  },
  copy: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  overline: {
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  cta: {
    marginTop: spacing.lg,
  },
  disclaimer: {
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
