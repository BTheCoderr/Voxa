import { StyleSheet, View } from 'react-native';

import { VoiceWaveDecoration } from '@/components/marketing/VoiceWaveDecoration';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { VoxaText } from '@/components/ui/VoxaText';
import { spacing } from '@/constants/theme';

/** Optional hero only when `EXPO_PUBLIC_SCREENSHOT_MODE=1` — framing for App Store captures. */
export function ScreenshotMarketingBanner() {
  return (
    <GlassPanel style={styles.wrap}>
      <VoiceWaveDecoration compact />
      <VoxaText variant="lead" style={styles.headline}>
        Your voice. Realistic scenarios.
      </VoxaText>
      <VoxaText variant="caption" style={styles.note}>
        Screenshot framing — enable with EXPO_PUBLIC_SCREENSHOT_MODE=1. Not a live session preview.
      </VoxaText>
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  headline: {
    textAlign: 'center',
  },
  note: {
    textAlign: 'center',
    opacity: 0.5,
    lineHeight: 18,
  },
});
