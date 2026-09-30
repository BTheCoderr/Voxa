import { StyleSheet, View } from 'react-native';

import { VoxaText } from '@/components/ui/VoxaText';
import { spacing } from '@/constants/theme';

/** Compact product-safety note for primary practice surfaces. */
export function BetaDisclaimer({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <VoxaText variant="caption" style={styles.compact}>
        AI practice can be imperfect · Voxa is not a certified language test
      </VoxaText>
    );
  }

  return (
    <View style={styles.block}>
      <VoxaText variant="caption" style={styles.line}>
        AI responses and corrections may be imperfect. Use Voxa to practice, experiment, and build speaking confidence.
      </VoxaText>
      <VoxaText variant="caption" style={styles.line}>
        Voxa is not a certified language test and does not replace a qualified teacher when you need formal instruction.
      </VoxaText>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  line: {
    opacity: 0.85,
    lineHeight: 18,
  },
  compact: {
    opacity: 0.72,
    marginTop: spacing.lg,
    lineHeight: 16,
  },
});
