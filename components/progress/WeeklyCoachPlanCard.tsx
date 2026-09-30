import { StyleSheet, View } from 'react-native';

import { GlassPanel } from '@/components/ui/GlassPanel';
import { VoxaButton } from '@/components/ui/VoxaButton';
import { VoxaText } from '@/components/ui/VoxaText';
import { palette, radii, spacing } from '@/constants/theme';
import type { WeeklyCoachPlan, WeeklyCoachPlanItem } from '@/lib/progress/weeklyCoachPlan';

type Props = {
  plan: WeeklyCoachPlan;
  languageLabel: string;
  onStart: (item: WeeklyCoachPlanItem) => void;
};

function sourceLabel(item: WeeklyCoachPlanItem): string {
  switch (item.source) {
    case 'correction_mastery':
      return 'Correction drill';
    case 'coach_memory':
      return 'Main focus';
    case 'range':
      return 'Build range';
    case 'foundation':
    default:
      return 'Foundation';
  }
}

export function WeeklyCoachPlanCard({ plan, languageLabel, onStart }: Props) {
  const progressLabel = `${plan.completedCount}/${plan.totalCount}`;
  const progressWidth = `${
    plan.totalCount > 0
      ? Math.round((plan.completedCount / plan.totalCount) * 100)
      : 0
  }%` as `${number}%`;

  return (
    <GlassPanel style={styles.card} intensity={34}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <VoxaText variant="caption" style={styles.overline}>
            This week · {languageLabel}
          </VoxaText>
          <VoxaText variant="title">{plan.headline}</VoxaText>
          <VoxaText variant="body" style={styles.summary}>
            {plan.summary}
          </VoxaText>
        </View>

        <View style={styles.progressPill}>
          <VoxaText variant="caption" style={styles.progressText}>
            {progressLabel}
          </VoxaText>
        </View>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: progressWidth }]} />
      </View>

      <View style={styles.items}>
        {plan.items.map((item) => (
          <View key={item.id} style={[styles.item, item.completed && styles.itemComplete]}>
            <View style={styles.itemTop}>
              <View style={styles.numberWrap}>
                <VoxaText variant="caption" style={styles.number}>
                  {item.completed ? '✓' : String(item.order).padStart(2, '0')}
                </VoxaText>
              </View>
              <View style={styles.itemCopy}>
                <VoxaText variant="caption" style={styles.source}>
                  {sourceLabel(item)}
                </VoxaText>
                <VoxaText variant="lead" style={styles.title}>
                  {item.scenarioTitle}
                </VoxaText>
              </View>
            </View>

            <VoxaText variant="body" style={styles.focus}>
              {item.focus}
            </VoxaText>
            <VoxaText variant="muted">{item.reason}</VoxaText>

            <View style={styles.mission}>
              <VoxaText variant="caption" style={styles.missionLabel}>
                Mission
              </VoxaText>
              <VoxaText variant="body">{item.mission}</VoxaText>
            </View>

            {item.completed ? (
              <VoxaText variant="caption" style={styles.completeLabel}>
                Completed this week
              </VoxaText>
            ) : (
              <VoxaButton
                title="Start this rep"
                onPress={() => onStart(item)}
                containerStyle={styles.button}
              />
            )}
          </View>
        ))}
      </View>

      <VoxaText variant="caption" style={styles.footnote}>
        Plan evidence is frozen at the start of the week, so completing a session will not reshuffle your remaining reps.
      </VoxaText>
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radii.xl },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  headerCopy: { flex: 1 },
  overline: { color: palette.cyan, textTransform: 'uppercase', letterSpacing: 1.1, marginBottom: spacing.xs },
  summary: { marginTop: spacing.xs },
  progressPill: { minWidth: 48, paddingHorizontal: 10, paddingVertical: 7, borderRadius: radii.full, alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: palette.cyanMuted, backgroundColor: 'rgba(56, 217, 255, 0.08)' },
  progressText: { color: palette.cyan, fontWeight: '800' },
  track: { height: 7, borderRadius: radii.full, backgroundColor: palette.frostStrong, overflow: 'hidden', marginTop: spacing.lg },
  fill: { height: '100%', borderRadius: radii.full, backgroundColor: palette.cyan },
  items: { marginTop: spacing.lg, gap: spacing.sm },
  item: { padding: spacing.md, borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.frostStrong, backgroundColor: palette.frost },
  itemComplete: { opacity: 0.7 },
  itemTop: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  numberWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: palette.cyanMuted, backgroundColor: 'rgba(56, 217, 255, 0.08)' },
  number: { color: palette.cyan, fontWeight: '800' },
  itemCopy: { flex: 1 },
  source: { color: palette.cyan, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '700' },
  title: { color: palette.textPrimary, fontWeight: '700', marginTop: 2 },
  focus: { color: palette.textPrimary, fontWeight: '700', marginTop: spacing.md },
  mission: { marginTop: spacing.md, gap: 3 },
  missionLabel: { color: palette.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
  button: { marginTop: spacing.md },
  completeLabel: { color: palette.cyan, fontWeight: '700', marginTop: spacing.md },
  footnote: { marginTop: spacing.lg, opacity: 0.8 },
});