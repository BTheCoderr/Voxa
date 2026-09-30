import { Pressable, StyleSheet, View } from 'react-native';

import { VoxaText } from '@/components/ui/VoxaText';
import { palette, radii, spacing } from '@/constants/theme';
import {
  practiceLevelDescription,
  practiceLevelLabel,
} from '@/lib/progress/adaptiveDifficulty';
import type { UserLevel } from '@/lib/realtime/types';

const LEVELS: UserLevel[] = ['beginner', 'intermediate', 'advanced'];

type Props = {
  value: UserLevel;
  onChange: (level: UserLevel) => void;
  showDescriptions?: boolean;
};

export function PracticeLevelPicker({ value, onChange, showDescriptions = false }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {LEVELS.map((level) => {
          const active = value === level;
          return (
            <Pressable
              key={level}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => onChange(level)}
              style={({ pressed }) => [
                styles.option,
                active && styles.optionActive,
                pressed && styles.pressed,
              ]}>
              <VoxaText variant="caption" style={[styles.label, active && styles.labelActive]}>
                {practiceLevelLabel(level)}
              </VoxaText>
            </Pressable>
          );
        })}
      </View>
      {showDescriptions ? (
        <VoxaText variant="muted" style={styles.description}>
          {practiceLevelDescription(value)}
        </VoxaText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  option: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.frostStrong,
    backgroundColor: palette.frost,
  },
  optionActive: {
    borderColor: palette.cyan,
    backgroundColor: 'rgba(56, 217, 255, 0.10)',
  },
  label: { fontWeight: '700' },
  labelActive: { color: palette.cyan },
  description: { lineHeight: 20 },
  pressed: { opacity: 0.75 },
});
