import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BetaDisclaimer } from '@/components/ui/BetaDisclaimer';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { VoiceWaveDecoration } from '@/components/marketing/VoiceWaveDecoration';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { ScreenLoading } from '@/components/ui/ScreenStates';
import { VoxaText } from '@/components/ui/VoxaText';
import { spacing } from '@/constants/theme';
import { useProgress } from '@/lib/progress/useProgress';

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const { progress, progressHydrated } = useProgress();

  if (!progressHydrated) {
    return <ScreenLoading message="Loading progress…" />;
  }

  return (
    <GradientBackground>
      <View style={[styles.container, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }]}>
        <VoxaText variant="caption" style={styles.overline}>
          TestFlight beta
        </VoxaText>
        <VoxaText variant="caption" style={styles.sub}>
          Momentum
        </VoxaText>
        <VoxaText variant="title">Confidence, measured gently</VoxaText>
        <VoxaText variant="body">Your streak counts speaking days — not perfection. XP rewards showing up and finishing a session.</VoxaText>
        <BetaDisclaimer compact />

        <View style={styles.row}>
          <GlassPanel style={styles.tile}>
            <VoxaText variant="caption" style={styles.metricLabel}>
              Streak
            </VoxaText>
            <VoxaText variant="hero" style={styles.metricValue}>
              {progress?.streak ?? 0}
            </VoxaText>
            <VoxaText variant="muted">days speaking</VoxaText>
          </GlassPanel>

          <GlassPanel style={styles.tile}>
            <VoxaText variant="caption" style={styles.metricLabel}>
              XP
            </VoxaText>
            <VoxaText variant="hero" style={styles.metricValue}>
              {progress?.xp ?? 0}
            </VoxaText>
            <VoxaText variant="muted">lifetime</VoxaText>
          </GlassPanel>
        </View>

        {(progress?.xp ?? 0) === 0 && (progress?.streak ?? 0) === 0 ? (
          <GlassPanel style={styles.zeroWrap}>
            <VoiceWaveDecoration compact />
            <VoxaText variant="body" style={styles.zeroBody}>
              Finish a voice session on the Practice tab to start earning XP and building your streak. Consistency matters
              more than perfection.
            </VoxaText>
          </GlassPanel>
        ) : null}
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  overline: {
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    opacity: 0.85,
  },
  sub: {
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginTop: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  tile: {
    flex: 1,
    minHeight: 150,
  },
  metricLabel: {
    marginBottom: spacing.xs,
  },
  metricValue: {
    marginBottom: 4,
    fontSize: 40,
    lineHeight: 44,
  },
  zeroWrap: {
    marginTop: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  zeroBody: {
    textAlign: 'center',
    opacity: 0.88,
    lineHeight: 22,
  },
});
