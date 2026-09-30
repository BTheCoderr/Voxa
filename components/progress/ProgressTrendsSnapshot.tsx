import { StyleSheet, View } from 'react-native';

import { GlassPanel } from '@/components/ui/GlassPanel';
import { VoxaButton } from '@/components/ui/VoxaButton';
import { VoxaText } from '@/components/ui/VoxaText';
import { palette, radii, spacing } from '@/constants/theme';
import type { ProgressTrendSummary } from '@/lib/progress/progressTrends';

type Props = {
  trends: ProgressTrendSummary;
  onOpen: () => void;
};

export function ProgressTrendsSnapshot({ trends, onOpen }: Props) {
  if (!trends.ready) {
    return (
      <GlassPanel style={styles.card} intensity={34}>
        <VoxaText variant="caption" style={styles.overline}>
          Progress trends
        </VoxaText>
        <VoxaText variant="title">{trends.headline}</VoxaText>
        <VoxaText variant="body" style={styles.summary}>
          {trends.summary}
        </VoxaText>
        <VoxaText variant="caption" style={styles.footnote}>
          {trends.sessionsAvailable} completed sessions available on this path.
        </VoxaText>
      </GlassPanel>
    );
  }

  const topItems = trends.items.slice(0, 2);

  return (
    <GlassPanel style={styles.card} intensity={34}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <VoxaText variant="caption" style={styles.overline}>
            Progress trends
          </VoxaText>
          <VoxaText variant="title">{trends.headline}</VoxaText>
        </View>
        <View style={styles.windowPill}>
          <VoxaText variant="caption" style={styles.windowText}>
            {trends.windowSize} vs {trends.windowSize}
          </VoxaText>
        </View>
      </View>

      <VoxaText variant="body" style={styles.summary}>
        {trends.summary}
      </VoxaText>

      <View style={styles.items}>
        {topItems.map((item) => (
          <View key={item.id} style={styles.item}>
            <VoxaText variant="caption" style={styles.itemLabel}>
              {item.eyebrow}
            </VoxaText>
            <VoxaText variant="lead" style={styles.itemTitle}>
              {item.title}
            </VoxaText>
            <View style={styles.compareRow}>
              <VoxaText variant="caption" style={styles.recent}>
                Recent · {item.recentLabel}
              </VoxaText>
              <VoxaText variant="caption">
                Earlier · {item.earlierLabel}
              </VoxaText>
            </View>
          </View>
        ))}
      </View>

      <VoxaButton
        title="Open progress trends"
        onPress={onOpen}
        containerStyle={styles.button}
      />
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radii.xl },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerCopy: { flex: 1 },
  overline: {
    color: palette.cyan,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  summary: { marginTop: spacing.sm },
  footnote: { marginTop: spacing.md, opacity: 0.8 },
  windowPill: {
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.cyanMuted,
    backgroundColor: 'rgba(56, 217, 255, 0.08)',
  },
  windowText: { color: palette.cyan, fontWeight: '700' },
  items: { marginTop: spacing.lg, gap: spacing.md },
  item: {
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.frostStrong,
    gap: 3,
  },
  itemLabel: {
    color: palette.cyan,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: '700',
  },
  itemTitle: { color: palette.textPrimary, fontWeight: '700' },
  compareRow: {
    marginTop: spacing.xs,
    gap: 2,
  },
  recent: { color: palette.textPrimary, fontWeight: '700' },
  button: { marginTop: spacing.lg },
});
