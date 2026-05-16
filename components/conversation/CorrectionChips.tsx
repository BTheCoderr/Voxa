import { VoxaText } from '@/components/ui/VoxaText';
import { palette, radii, spacing } from '@/constants/theme';
import { StyleSheet, View } from 'react-native';

type Props = {
  items: string[];
};

export function CorrectionChips({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <VoxaText variant="caption" style={styles.heading}>
        Gentle notes
      </VoxaText>
      {items.map((t, i) => (
        <View key={`${i}-${t.slice(0, 12)}`} style={styles.chip}>
          <VoxaText variant="body" style={styles.chipText}>
            {t}
          </VoxaText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  heading: {
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    opacity: 0.75,
  },
  chip: {
    borderRadius: radii.md,
    padding: spacing.sm,
    backgroundColor: 'rgba(59, 108, 255, 0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(59, 108, 255, 0.35)',
  },
  chipText: {
    color: palette.textPrimary,
    fontSize: 15,
  },
});
