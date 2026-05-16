import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { gradients, palette } from '@/constants/theme';

import type { VoiceSessionPhase } from '@/lib/realtime/voiceSessionTypes';

type Props = {
  phase: VoiceSessionPhase;
};

export function VoiceOrb({ phase }: Props) {
  const pulse = useRef(new Animated.Value(0)).current;

  const activePulse =
    phase === 'connecting' ||
    phase === 'minting_session' ||
    phase === 'requesting_permission' ||
    phase === 'connected' ||
    phase === 'listening' ||
    phase === 'ai_speaking';

  const liveEnergy = phase === 'listening' || phase === 'ai_speaking' || phase === 'connected';

  useEffect(() => {
    if (!activePulse) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }

    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: liveEnergy && phase === 'listening' ? 1100 : liveEnergy ? 1500 : 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: liveEnergy && phase === 'listening' ? 1100 : liveEnergy ? 1500 : 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [activePulse, liveEnergy, phase, pulse]);

  const scale = useMemo(
    () =>
      pulse.interpolate({
        inputRange: [0, 1],
        outputRange:
          phase === 'listening' ? [1, 1.07] : phase === 'ai_speaking' ? [1, 1.05] : [0.98, 1.03],
      }),
    [pulse, phase],
  );

  const opacity = useMemo(
    () =>
      pulse.interpolate({
        inputRange: [0, 1],
        outputRange: [0.72, 1],
      }),
    [pulse],
  );

  const coreOpacity = phase === 'error' || phase === 'ended' ? 0.55 : 1;

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.halo, { transform: [{ scale }], opacity }]} />
      <LinearGradient
        colors={[...gradients.orb]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.core, { opacity: coreOpacity }]}>
        <View style={styles.highlight} />
      </LinearGradient>
    </View>
  );
}

const CORE = 168;

const styles = StyleSheet.create({
  wrap: {
    width: CORE + 44,
    height: CORE + 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: CORE + 36,
    height: CORE + 36,
    borderRadius: 999,
    backgroundColor: palette.cyanMuted,
  },
  core: {
    width: CORE,
    height: CORE,
    borderRadius: CORE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.55,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
  },
  highlight: {
    width: CORE * 0.62,
    height: CORE * 0.62,
    borderRadius: CORE,
    backgroundColor: 'rgba(255,255,255,0.12)',
    transform: [{ translateY: -10 }],
  },
});
