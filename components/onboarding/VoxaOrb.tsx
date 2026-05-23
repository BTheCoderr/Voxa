import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { gradients, radii } from '@/constants/theme';

type VoxaOrbProps = {
  size?: number;
};

/** Abstract Voxa avatar — gradient orb, no external assets. */
export function VoxaOrb({ size = 56 }: VoxaOrbProps) {
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2 }]}>
      <LinearGradient
        colors={[...gradients.orb]}
        start={{ x: 0.1, y: 0.1 }}
        end={{ x: 0.9, y: 0.9 }}
        style={[styles.gradient, { borderRadius: size / 2 }]}
      />
      <View style={[styles.core, { width: size * 0.35, height: size * 0.35, borderRadius: size }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    shadowColor: '#38D9FF',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  gradient: {
    flex: 1,
  },
  core: {
    position: 'absolute',
    top: '22%',
    left: '28%',
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
});
