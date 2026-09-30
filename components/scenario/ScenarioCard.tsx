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
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${scenario.title}, ${scenario.durationMin} minutes, ${scenario.difficulty}`}
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}>
      <GlassPanel style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.heading}>
            <VoxaText variant="caption" style={styles.focus}>
              {scenario.focus}
            </VoxaText>
            <VoxaText variant="title" style={styles.title}>
              {scenario.title}
            </VoxaText>
          </View>

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

        <View style={styles.footerRow}>
          <VoxaText variant="caption" style={styles.difficulty}>
            {scenario.difficulty}
          </VoxaText>
          {actionLabel ? (
            <VoxaText variant="caption" style={styles.action}>
              {actionLabel} →
            </VoxaText>
          ) : null}
        </View>
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
  heading: {
    flex: 1,
    gap: 2,
  },
  focus: {
    color: palette.cyan,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
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
  footerRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  difficulty: {
    opacity: 0.72,
  },
  action: {
    color: palette.cyan,
    fontWeight: '700',
    textAlign: 'right',
  },
  pillText: {
    color: palette.textSecondary,
  },
});
