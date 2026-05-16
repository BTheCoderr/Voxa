import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { palette, radii, spacing } from '@/constants/theme';

const RELATIVE_HEIGHTS = [0.38, 0.62, 0.92, 0.72, 0.5, 0.84, 0.44, 0.68];

const BAR_WIDTH = 5;
const MAX_BAR = 52;

export function VoiceWaveDecoration({ compact = false }: { compact?: boolean }) {
  const maxH = compact ? 36 : MAX_BAR;
  const w = compact ? 4 : BAR_WIDTH;
  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      {RELATIVE_HEIGHTS.map((r, i) => (
        <LinearGradient
          key={i}
          colors={[palette.electricBlue, palette.cyan]}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={[
            styles.bar,
            {
              width: w,
              height: Math.round(maxH * r),
              opacity: 0.45 + r * 0.45,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: spacing.md,
  },
  rowCompact: {
    paddingVertical: spacing.sm,
    gap: 4,
  },
  bar: {
    borderRadius: radii.full,
  },
});
