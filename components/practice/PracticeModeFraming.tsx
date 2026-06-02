import { StyleSheet, View } from 'react-native';

import { GlassPanel } from '@/components/ui/GlassPanel';
import { VoxaText } from '@/components/ui/VoxaText';
import { spacing } from '@/constants/theme';
import { isLiveVoicePracticeAvailable } from '@/lib/presentation/voicePracticeEnabled';

/** Explains how text practice works in production; voice panel only in dev/screenshot builds. */
export function PracticeModeFraming() {
  if (isLiveVoicePracticeAvailable()) {
    return (
      <GlassPanel style={styles.panel}>
        <VoxaText variant="lead">Live conversation (preview)</VoxaText>
        <VoxaText variant="body">
          Speak out loud and get real-time voice replies. For App Store, use text practice with optional Hear this
          response playback.
        </VoxaText>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel style={styles.panel}>
      <VoxaText variant="lead">How practice works</VoxaText>
      <VoxaText variant="body">
        Pick a scenario or lesson, type your responses, and get AI replies with gentle corrections. Tap Hear this
        response when you want to hear a reply aloud.
      </VoxaText>
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
