import { Pressable, StyleSheet, View } from 'react-native';

import { GlassPanel } from '@/components/ui/GlassPanel';
import { VoxaButton } from '@/components/ui/VoxaButton';
import { VoxaText } from '@/components/ui/VoxaText';
import { palette, radii, spacing } from '@/constants/theme';
import type { ComebackNudge } from '@/lib/practice/comeback';

type Props = {
  nudge: ComebackNudge;
  onStart: () => void;
  onDismiss: () => void;
};

export function ComebackNudgeCard({ nudge, onStart, onDismiss }: Props) {
  return (
    <GlassPanel style={styles.card} intensity={36}>
      <View style={styles.headerRow}>
        <View style={styles.copy}>
          <VoxaText variant="caption" style={styles.overline}>
            {nudge.eyebrow}
          </VoxaText>
          <VoxaText variant="title">{nudge.title}</VoxaText>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss this coaching nudge for today"
          hitSlop={12}
          onPress={onDismiss}
          style={({ pressed }) => [styles.dismiss, pressed && styles.pressed]}>
          <VoxaText variant="caption" style={styles.dismissText}>
            Not today
          </VoxaText>
        </Pressable>
      </View>

      <VoxaText variant="body" style={styles.body}>
        {nudge.body}
      </VoxaText>

      <VoxaButton
        title={nudge.actionLabel}
        onPress={onStart}
        containerStyle={styles.button}
      />

      <VoxaText variant="caption" style={styles.footnote}>
        One nudge at a time. Dismiss it and Voxa leaves you alone until tomorrow.
      </VoxaText>
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.cyanMuted,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  copy: { flex: 1 },
  overline: {
    color: palette.cyan,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
    fontWeight: '700',
  },
  dismiss: {
    paddingVertical: 5,
    paddingHorizontal: 7,
  },
  dismissText: {
    color: palette.textMuted,
    fontWeight: '600',
  },
  body: {
    marginTop: spacing.sm,
  },
  button: {
    marginTop: spacing.lg,
  },
  footnote: {
    marginTop: spacing.sm,
    opacity: 0.72,
  },
  pressed: {
    opacity: 0.65,
  },
});
