import { StyleSheet, View } from 'react-native';

import { VoxaText } from '@/components/ui/VoxaText';
import { spacing } from '@/constants/theme';

/** TestFlight-safe, compact disclaimers for primary surfaces. */
export function BetaDisclaimer({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <VoxaText variant="caption" style={styles.compact}>
        TestFlight beta · AI may be imperfect · Practice aid, not a certified language test
      </VoxaText>
    );
  }

  return (
    <View style={styles.block}>
      <VoxaText variant="caption" style={styles.line}>
        TestFlight beta — you’re helping us harden Voxa before a wider release.
      </VoxaText>
      <VoxaText variant="caption" style={styles.line}>
        AI responses may be imperfect. Voxa is a practice tool, not a certified language test or tutor replacement.
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
    opacity: 0.75,
    marginTop: spacing.xs,
    lineHeight: 16,
  },
});
