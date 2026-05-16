import type { ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { gradients, palette } from '@/constants/theme';

type Props = ViewProps & {
  children: ReactNode;
};

export function GradientBackground({ children, style, ...rest }: Props) {
  return (
    <View style={[styles.wrap, style]} {...rest}>
      <LinearGradient colors={[...gradients.background]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={styles.vignette} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: palette.void,
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 10, 18, 0.25)',
  },
});
