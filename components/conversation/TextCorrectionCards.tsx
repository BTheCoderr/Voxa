import { ScrollView, StyleSheet, View } from 'react-native';

import { VoxaText } from '@/components/ui/VoxaText';
import { palette, radii, spacing } from '@/constants/theme';
import type { ChatCoachCorrection } from '@/lib/ai/providers/types';

type Props = {
  items: ChatCoachCorrection[];
  encouragement?: string;
};

export function TextCorrectionCards({ items, encouragement }: Props) {
  if (items.length === 0 && !encouragement) return null;

  return (
    <View style={styles.wrap}>
      {encouragement ? (
        <VoxaText variant="body" style={styles.encouragement}>
          {encouragement}
        </VoxaText>
      ) : null}
      {items.length > 0 ? (
        <>
          <VoxaText variant="caption" style={styles.heading}>
            Gentle notes
          </VoxaText>
          {items.map((c, i) => (
            <View key={`${i}-${c.original.slice(0, 8)}`} style={styles.card}>
              {c.original ? (
                <VoxaText variant="caption" style={styles.original}>
                  {c.original}
                </VoxaText>
              ) : null}
              {c.improved ? (
                <VoxaText variant="body" style={styles.improved}>
                  → {c.improved}
                </VoxaText>
              ) : null}
              {c.explanation ? (
                <VoxaText variant="caption" style={styles.explanation}>
                  {c.explanation}
                </VoxaText>
              ) : null}
            </View>
          ))}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  heading: {
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    opacity: 0.75,
  },
  encouragement: {
    color: palette.cyan,
    fontStyle: 'italic',
  },
  card: {
    borderRadius: radii.md,
    padding: spacing.sm,
    backgroundColor: 'rgba(59, 108, 255, 0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(59, 108, 255, 0.35)',
    gap: 4,
  },
  original: {
    color: palette.textMuted,
    textDecorationLine: 'line-through',
  },
  improved: {
    color: palette.textPrimary,
    fontWeight: '600',
  },
  explanation: {
    color: palette.textSecondary,
    marginTop: 2,
  },
});
