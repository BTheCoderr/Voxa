import { Pressable, StyleSheet, View } from 'react-native';

import type { Scenario } from '@/constants/scenarios';
import { palette, radii, spacing } from '@/constants/theme';

import { GlassPanel } from '@/components/ui/GlassPanel';
import { VoxaText } from '@/components/ui/VoxaText';

type Props = {
  scenario: Scenario;
  onPress: () => void;
  actionLabel?: string;
  badge?: string;
};

export function ScenarioCard({ scenario, onPress, actionLabel, badge }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}>
      <GlassPanel style={styles.card}>
        <View style={styles.topRow}>
          <VoxaText variant="title" style={styles.title}>
            {scenario.title}
          </VoxaText>
          <View style={styles.pillRow}>
            {badge ? (
              <View style={[styles.pill, styles.badgePill]}>
                <VoxaText variant="caption" style={styles.badgeText}>
                  {badge}
                </VoxaText>
              </View>
            ) : null}
            <View style={styles.pill}>
              <VoxaText variant="caption" style={styles.pillText}>
                {scenario.durationMin} min
              </VoxaText>
            </View>
          </View>
        </View>
        <VoxaText variant="body">{scenario.subtitle}</VoxaText>
        {actionLabel ? (
          <VoxaText variant="caption" style={styles.action}>
            {actionLabel} →
          </VoxaText>
        ) : null}
      </GlassPanel>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    marginBottom: spacing.md,
  },
  pressed: {
    transform: [{ scale: 0.997 }],
    opacity: 0.95,
  },
  card: {
    borderRadius: radii.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: 20,
  },
  pill: {
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: palette.frost,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.frostStrong,
  },
  pillRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
  },
  badgePill: {
    borderColor: palette.cyan,
  },
  badgeText: {
    color: palette.cyan,
    fontWeight: '700',
  },
  action: {
    marginTop: spacing.sm,
    color: palette.cyan,
    fontWeight: '600',
  },
  pillText: {
    color: palette.textSecondary,
  },
});
