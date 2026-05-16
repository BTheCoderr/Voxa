import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View, type ViewProps } from 'react-native';

import { palette, radii } from '@/constants/theme';

type Props = ViewProps & {
  children: React.ReactNode;
  intensity?: number;
};

export function GlassPanel({ children, style, intensity = 28, ...rest }: Props) {
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.fallback, style]} {...rest}>
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.shell, style]} {...rest}>
      <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.border} />
      <View style={styles.inner}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: palette.frost,
  },
  inner: {
    padding: 16,
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.frostStrong,
  },
  fallback: {
    borderRadius: radii.lg,
    backgroundColor: palette.frost,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.frostStrong,
    padding: 16,
  },
});
