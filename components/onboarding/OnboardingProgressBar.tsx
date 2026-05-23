import { StyleSheet, View } from 'react-native';

import { palette, radii, spacing } from '@/constants/theme';

type OnboardingProgressBarProps = {
  step: number;
  total: number;
};

export function OnboardingProgressBar({ step, total }: OnboardingProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (step / total) * 100));

  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${pct}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 4,
    borderRadius: radii.full,
    backgroundColor: palette.frost,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  fill: {
    height: '100%',
    borderRadius: radii.full,
    backgroundColor: palette.cyan,
  },
});
