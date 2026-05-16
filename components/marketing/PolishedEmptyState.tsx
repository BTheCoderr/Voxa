import { StyleSheet, View } from 'react-native';

import { VoiceWaveDecoration } from '@/components/marketing/VoiceWaveDecoration';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { VoxaText } from '@/components/ui/VoxaText';
import { spacing } from '@/constants/theme';

type Props = {
  title: string;
  body: string;
  footnote?: string;
  compact?: boolean;
};

/** Premium empty state for history and similar surfaces (screenshots + early users). */
export function PolishedEmptyState({ title, body, footnote, compact }: Props) {
  return (
    <GlassPanel style={[styles.panel, compact && styles.panelCompact]}>
      <VoiceWaveDecoration compact={!!compact} />
      <VoxaText variant="lead" style={styles.title}>
        {title}
      </VoxaText>
      <VoxaText variant="body" style={styles.body}>
        {body}
      </VoxaText>
      {footnote ? (
        <View style={styles.foot}>
          <VoxaText variant="caption" style={styles.footnote}>
            {footnote}
          </VoxaText>
        </View>
      ) : null}
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginTop: spacing.md,
    gap: spacing.sm,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  panelCompact: {
    paddingVertical: spacing.md,
  },
  title: {
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  body: {
    textAlign: 'center',
    opacity: 0.88,
    lineHeight: 22,
  },
  foot: {
    marginTop: spacing.sm,
  },
  footnote: {
    textAlign: 'center',
    opacity: 0.55,
    lineHeight: 18,
  },
});
