import { Pressable, StyleSheet, View } from 'react-native';

import { GlassPanel } from '@/components/ui/GlassPanel';
import { VoxaText } from '@/components/ui/VoxaText';
import type { LessonNode } from '@/lib/learning/types';
import { palette, radii, spacing } from '@/constants/theme';

type LessonNodeCardProps = {
  lesson: LessonNode;
  locked: boolean;
  completed: boolean;
  onPress: () => void;
};

export function LessonNodeCard({ lesson, locked, completed, onPress }: LessonNodeCardProps) {
  return (
    <Pressable onPress={onPress} disabled={locked} style={({ pressed }) => [styles.wrap, pressed && !locked && styles.pressed]}>
      <GlassPanel
        style={[
          styles.card,
          locked && styles.locked,
          completed && styles.completed,
          !locked && styles.unlocked,
        ]}>
        <View style={styles.row}>
          <View style={[styles.badge, locked ? styles.badgeLocked : styles.badgeOpen]}>
            <VoxaText variant="caption" style={styles.badgeText}>
              {locked ? '🔒' : completed ? '✓' : String(lesson.order)}
            </VoxaText>
          </View>
          <View style={styles.body}>
            <VoxaText variant="lead" style={locked ? styles.dim : undefined}>
              {lesson.title}
            </VoxaText>
            <VoxaText variant="muted" style={locked ? styles.dim : undefined}>
              {lesson.subtitle}
            </VoxaText>
          </View>
        </View>
      </GlassPanel>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radii.lg,
  },
  pressed: {
    opacity: 0.92,
  },
  card: {
    borderRadius: radii.lg,
  },
  locked: {
    opacity: 0.55,
  },
  completed: {
    borderColor: palette.success,
    borderWidth: StyleSheet.hairlineWidth,
  },
  unlocked: {
    borderColor: palette.electricBlue,
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeOpen: {
    backgroundColor: 'rgba(56, 217, 255, 0.15)',
  },
  badgeLocked: {
    backgroundColor: palette.frost,
  },
  badgeText: {
    fontWeight: '700',
  },
  body: {
    flex: 1,
    gap: 2,
  },
  dim: {
    opacity: 0.7,
  },
});
