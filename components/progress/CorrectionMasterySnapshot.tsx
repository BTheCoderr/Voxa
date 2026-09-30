import { StyleSheet, View } from 'react-native';

import { GlassPanel } from '@/components/ui/GlassPanel';
import { VoxaButton } from '@/components/ui/VoxaButton';
import { VoxaText } from '@/components/ui/VoxaText';
import { palette, radii, spacing } from '@/constants/theme';
import type { CorrectionMasterySummary } from '@/lib/progress/correctionMastery';

type Props = {
  mastery: CorrectionMasterySummary;
  onOpen: () => void;
};

export function CorrectionMasterySnapshot({ mastery, onOpen }: Props) {
  const topPattern =
    mastery.patterns.find((pattern) => pattern.status === 'recurring') ??
    mastery.patterns.find((pattern) => pattern.status === 'improving') ??
    mastery.patterns[0] ??
    null;

  return (
    <GlassPanel style={styles.card} intensity={34}>
      <View style={styles.topRow}>
        <View style={styles.copy}>
          <VoxaText variant="caption" style={styles.overline}>
            Correction mastery
          </VoxaText>
          <VoxaText variant="title">{mastery.headline}</VoxaText>
        </View>
        <View style={styles.countPill}>
          <VoxaText variant="caption" style={styles.countText}>
            {mastery.patterns.length}
          </VoxaText>
        </View>
      </View>

      <VoxaText variant="body" style={styles.summary}>
        {mastery.summary}
      </VoxaText>

      <View style={styles.metrics}>
        <Metric label="Active" value={mastery.recurringCount + mastery.newCount} />
        <Metric label="Improving" value={mastery.improvingCount} />
        <Metric label="Mastered" value={mastery.masteredCount} />
      </View>

      {topPattern ? (
        <View style={styles.topPattern}>
          <VoxaText variant="caption" style={styles.patternLabel}>
            {topPattern.status === 'recurring'
              ? 'Needs another rep'
              : topPattern.status === 'improving'
                ? 'Getting quieter'
                : topPattern.status === 'mastered'
                  ? 'Mastered for now'
                  : 'New correction'}
          </VoxaText>
          <VoxaText variant="lead" style={styles.patternPhrase}>
            {topPattern.targetPhrase}
          </VoxaText>
          <VoxaText variant="muted">{topPattern.evidence}</VoxaText>
        </View>
      ) : null}

      <VoxaButton
        title={mastery.patterns.length > 0 ? 'Open correction mastery' : 'See how mastery works'}
        onPress={onOpen}
        containerStyle={styles.cta}
      />
    </GlassPanel>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.metric}>
      <VoxaText variant="lead" style={styles.metricValue}>
        {value}
      </VoxaText>
      <VoxaText variant="caption">{label}</VoxaText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  copy: {
    flex: 1,
  },
  overline: {
    color: palette.cyan,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
  },
  countPill: {
    minWidth: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.cyanMuted,
    backgroundColor: 'rgba(56, 217, 255, 0.08)',
  },
  countText: {
    color: palette.cyan,
    fontWeight: '800',
  },
  summary: {
    marginTop: spacing.md,
  },
  metrics: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  metric: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.frostStrong,
    backgroundColor: palette.frost,
  },
  metricValue: {
    color: palette.textPrimary,
    fontWeight: '800',
  },
  topPattern: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.frostStrong,
    gap: 3,
  },
  patternLabel: {
    color: palette.cyan,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    fontWeight: '700',
  },
  patternPhrase: {
    color: palette.textPrimary,
    fontWeight: '700',
  },
  cta: {
    marginTop: spacing.lg,
  },
});
