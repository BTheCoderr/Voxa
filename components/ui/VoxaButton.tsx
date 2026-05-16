import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, type PressableProps, type TextStyle, type ViewStyle } from 'react-native';

import { gradients, palette, radii, typography } from '@/constants/theme';

type Variant = 'primary' | 'ghost' | 'subtle';

type Props = PressableProps & {
  title: string;
  variant?: Variant;
  containerStyle?: ViewStyle;
  textStyle?: TextStyle;
};

export function VoxaButton({
  title,
  variant = 'primary',
  disabled,
  containerStyle,
  textStyle,
  ...rest
}: Props) {
  const isDisabled = Boolean(disabled);

  if (variant === 'primary') {
    return (
      <Pressable
        accessibilityRole="button"
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.base,
          pressed && !isDisabled && styles.pressed,
          isDisabled && styles.disabled,
          containerStyle,
        ]}
        {...rest}>
        <LinearGradient
          colors={isDisabled ? ['#2A355E', '#2A355E'] : [...gradients.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}>
          <Text style={[styles.primaryLabel, textStyle]}>{title}</Text>
        </LinearGradient>
      </Pressable>
    );
  }

  if (variant === 'ghost') {
    return (
      <Pressable
        accessibilityRole="button"
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.ghost,
          pressed && !isDisabled && styles.pressed,
          isDisabled && styles.disabled,
          containerStyle,
        ]}
        {...rest}>
        <Text style={[styles.ghostLabel, textStyle]}>{title}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.subtle,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        containerStyle,
      ]}
      {...rest}>
      <Text style={[styles.subtleLabel, textStyle]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  gradient: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.full,
  },
  primaryLabel: {
    color: palette.void,
    fontSize: typography.sizes.body,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  ghost: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.frostStrong,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  ghostLabel: {
    color: palette.textPrimary,
    fontSize: typography.sizes.body,
    fontWeight: '600',
  },
  subtle: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    backgroundColor: palette.frost,
    alignItems: 'center',
  },
  subtleLabel: {
    color: palette.textSecondary,
    fontSize: typography.sizes.caption,
    fontWeight: '600',
  },
  pressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.45,
  },
});
