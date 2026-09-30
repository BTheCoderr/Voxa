import { StyleSheet, View } from 'react-native';

import { GlassPanel } from '@/components/ui/GlassPanel';
import { VoxaButton } from '@/components/ui/VoxaButton';
import { VoxaText } from '@/components/ui/VoxaText';
import { palette, radii, spacing } from '@/constants/theme';
import type { ChatCoachCorrection, SessionCoachReview } from '@/lib/ai/providers/types';

type Props = {
  review: SessionCoachReview;
  correction?: ChatCoachCorrection | null;
  durationLabel: string;
  xpEarned: number;
  onPracticeNext: () => void;
  onHistory: () => void;
  onDone: () => void;
};

export function CoachRecap({
  review,
  correction,
  durationLabel,
  xpEarned,
  onPracticeNext,
  onHistory,
  onDone,
}: Props) {
  return (
    <GlassPanel style={styles.panel} intensity={34}>
      <VoxaText variant="caption" style={styles.overline}>
        Coach recap
      </VoxaText>
      <VoxaText variant="title">{review.headline}</VoxaText>

      <View style={styles.coachGrid}>
        <CoachPoint label="What worked" body={review.strength} />
        <CoachPoint label="Work on next" body={review.focus} />
      </View>

      {correction?.improved ? (
        <View style={styles.correction}>
          <VoxaText variant="caption" style={styles.pointLabel}>
            Keep this phrase
          </VoxaText>
          {correction.original ? (
            <VoxaText variant="muted" style={styles.original}>
              {correction.original}
            </VoxaText>
          ) : null}
          <VoxaText variant="body" style={styles.improved}>
            {correction.improved}
          </VoxaText>
          {correction.explanation ? <VoxaText variant="caption">{correction.explanation}</VoxaText> : null}
        </View>
      ) : null}

      <View style={styles.nextMission}>
        <View style={styles.nextBadge}>
          <VoxaText variant="caption" style={styles.nextBadgeText}>
            Next mission
          </VoxaText>
        </View>
        <VoxaText variant="lead" style={styles.nextCopy}>
          {review.nextMission}
        </VoxaText>
      </View>

      <View style={styles.stats}>
        <VoxaText variant="caption">{durationLabel}</VoxaText>
        <View style={styles.dot} />
        <VoxaText variant="caption">+{xpEarned} XP</VoxaText>
      </View>

      <VoxaButton title="Practice this next" onPress={onPracticeNext} containerStyle={styles.primary} />
      <View style={styles.buttonRow}>
        <VoxaButton title="History" variant="ghost" onPress={onHistory} containerStyle={styles.flex} />
        <VoxaButton title="Done" variant="subtle" onPress={onDone} containerStyle={styles.flex} />
      </View>
    </GlassPanel>
  );
}

function CoachPoint({ label, body }: { label: string; body: string }) {
  return (
    <View style={styles.point}>
      <VoxaText variant="caption" style={styles.pointLabel}>
        {label}
      </VoxaText>
      <VoxaText variant="body">{body}</VoxaText>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: radii.xl,
  },
  overline: {
    color: palette.cyan,
    textTransform: 'uppercase',
    letterSpacing: 1.3,
    marginBottom: spacing.xs,
  },
  coachGrid: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  point: {
    gap: 3,
  },
  pointLabel: {
    color: palette.cyan,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  correction: {
    marginTop: spacing.lg,
    gap: 4,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: palette.frost,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.frostStrong,
  },
  original: {
    textDecorationLine: 'line-through',
  },
  improved: {
    color: palette.textPrimary,
    fontWeight: '700',
  },
  nextMission: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(56, 217, 255, 0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.cyanMuted,
    gap: spacing.sm,
  },
  nextBadge: {
    alignSelf: 'flex-start',
    borderRadius: radii.full,
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: 'rgba(56, 217, 255, 0.1)',
  },
  nextBadgeText: {
    color: palette.cyan,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  nextCopy: {
    color: palette.textPrimary,
    fontWeight: '600',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.textMuted,
  },
  primary: {
    marginTop: spacing.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  flex: {
    flex: 1,
  },
});
