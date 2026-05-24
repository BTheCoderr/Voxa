import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { VoiceWaveDecoration } from '@/components/marketing/VoiceWaveDecoration';
import { VoxaOrb } from '@/components/onboarding/VoxaOrb';
import { BetaDisclaimer } from '@/components/ui/BetaDisclaimer';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { VoxaText } from '@/components/ui/VoxaText';
import { palette, spacing } from '@/constants/theme';

type VoxaSplashScreenProps = {
  /** When true, show connection fallback copy instead of default loading message. */
  slowLoad?: boolean;
  /** Override default loading copy. */
  message?: string;
};

export function VoxaSplashScreen({ slowLoad = false, message }: VoxaSplashScreenProps) {
  const loadingCopy = slowLoad
    ? 'Still loading. Check your connection.'
    : (message ?? 'Preparing your practice space…');
  return (
    <GradientBackground>
      <View style={styles.center}>
        <VoxaText variant="caption" style={styles.wordmarkOverline}>
          VOXA
        </VoxaText>
        <VoxaOrb size={96} />
        <VoiceWaveDecoration compact />
        <VoxaText variant="hero" style={styles.wordmark}>
          Voxa
        </VoxaText>
        <VoxaText variant="body" style={styles.loadingCopy}>
          {loadingCopy}
        </VoxaText>
        {!slowLoad ? <ActivityIndicator size="large" color={palette.cyan} style={styles.spinner} /> : null}
        <BetaDisclaimer compact />
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  wordmarkOverline: {
    letterSpacing: 4,
    textTransform: 'uppercase',
    opacity: 0.85,
  },
  wordmark: {
    letterSpacing: -0.5,
  },
  loadingCopy: {
    textAlign: 'center',
    opacity: 0.9,
    maxWidth: 280,
  },
  spinner: {
    marginTop: spacing.sm,
  },
});
