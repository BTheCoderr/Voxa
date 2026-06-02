import { StyleSheet } from 'react-native';

import { VoxaText } from '@/components/ui/VoxaText';
import { spacing } from '@/constants/theme';

/** Short public-release product line — no beta or pre-release language. */
export function AppTagline({ compact = false }: { compact?: boolean }) {
  return (
    <VoxaText variant="caption" style={compact ? styles.compact : styles.line}>
      AI speaking practice for real-world conversations.
    </VoxaText>
  );
}

const styles = StyleSheet.create({
  line: {
    opacity: 0.85,
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  compact: {
    opacity: 0.75,
    marginTop: spacing.xs,
    lineHeight: 16,
  },
});
