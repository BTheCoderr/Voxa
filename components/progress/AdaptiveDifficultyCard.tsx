import { StyleSheet, View } from 'react-native';

import { GlassPanel } from '@/components/ui/GlassPanel';
import { VoxaButton } from '@/components/ui/VoxaButton';
import { VoxaText } from '@/components/ui/VoxaText';
import { palette, radii, spacing } from '@/constants/theme';
import {
  practiceLevelLabel,
  type DifficultyRecommendation,
} from '@/lib/progress/adaptiveDifficulty';

type Props = {
  recommendation: DifficultyRecommendation;
  onApplySuggested: () => void;
};

export function AdaptiveDifficultyCard({ recommendation, onApplySuggested }: Props) {
  const hasSuggestion = Boolean(recommendation.suggestedLevel);

  return (
    <GlassPanel style={styles.card} intensity={34}>
      <VoxaText variant="caption" style={styles.overline}>
        Adaptive difficulty
      </VoxaText>
      <VoxaText variant="title">{recommendation.headline}</VoxaText>
      <VoxaText variant="body" style={styles.summary}>
        {recommendation.summary}
      </VoxaText>

      <View style={styles.metrics}>
        <View style={styles.metric}>
          <VoxaText variant="lead" style={styles.metricValue}>
            {recommendation.sessionsAnalyzed}
          </VoxaText>
          <VoxaText variant="caption">recent sessions</VoxaText>
        </View>
        <View style={styles.metric}>
          <VoxaText variant="lead" style={styles.metricValue}>
            {recommendation.userTurnsAnalyzed}
          </VoxaText>
          <VoxaText variant="caption">learner turns</VoxaText>
        </View>
      </View>

      <VoxaText variant="caption" style={styles.note}>
        Current: {practiceLevelLabel(recommendation.currentLevel)}. Voxa uses saved corrections only as one practice signal—not as a test score.
      </VoxaText>

      {hasSuggestion && recommendation.suggestedLevel ? (
        <VoxaButton
          title={`Switch to ${practiceLevelLabel(recommendation.suggestedLevel)}`}
          onPress={onApplySuggested}
          containerStyle={styles.button}
        />
      ) : null}
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radii.xl },
  overline: {
    color: palette.cyan,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  summary: { marginTop: spacing.sm },
  metrics: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  metric: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: palette.frost,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.frostStrong,
  },
  metricValue: { color: palette.textPrimary, fontWeight: '800' },
  note: { marginTop: spacing.md, opacity: 0.8 },
  button: { marginTop: spacing.lg },
});