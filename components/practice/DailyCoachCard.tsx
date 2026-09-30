import { StyleSheet, View } from 'react-native';

import { GlassPanel } from '@/components/ui/GlassPanel';
import { VoxaButton } from '@/components/ui/VoxaButton';
import { VoxaText } from '@/components/ui/VoxaText';
import type { Scenario } from '@/constants/scenarios';
import { palette, radii, spacing } from '@/constants/theme';

type Props = {
  scenario: Scenario;
  languageLabel: string;
  streak: number;
  completedToday: boolean;
  onStart: () => void;
};

export function DailyCoachCard({
  scenario,
  languageLabel,
  streak,
  completedToday,
  onStart,
}: Props) {
  return (
    <GlassPanel style={styles.shell} intensity={34}>
      <View style={styles.topRow}>
        <View>
          <VoxaText variant="caption" style={styles.overline}>
            Today's mission
          </VoxaText>
          <VoxaText variant="title" style={styles.title}>
            {completedToday ? 'Keep the momentum going' : scenario.title}
          </VoxaText>
        </View>

        <View style={[styles.statusPill, completedToday && styles.statusDone]}>
          <VoxaText variant="caption" style={styles.statusText}>
            {completedToday ? 'Done today' : `${scenario.durationMin} min`}
          </VoxaText>
        </View>
      </View>

      <VoxaText variant="body" style={styles.body}>
        {completedToday
          ? `You already practiced today. A second round can reinforce ${scenario.focus.toLowerCase()}.`
          : scenario.mission}
      </VoxaText>

      <View style={styles.metaRow}>
        <View style={styles.metaPill}>
          <VoxaText variant="caption">{languageLabel}</VoxaText>
        </View>
        <View style={styles.metaPill}>
          <VoxaText variant="caption">{scenario.focus}</VoxaText>
        </View>
        {streak > 0 ? (
          <View style={styles.metaPill}>
            <VoxaText variant="caption">{streak} day streak</VoxaText>
          </View>
        ) : null}
      </View>

      <VoxaButton
        title={completedToday ? 'Practice again' : 'Start today’s mission'}
        onPress={onStart}
        containerStyle={styles.cta}
      />
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  shell: {
    marginTop: spacing.lg,
    borderRadius: radii.xl,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  overline: {
    color: palette.cyan,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  title: {
    maxWidth: 230,
  },
  body: {
    marginTop: spacing.md,
  },
  statusPill: {
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.cyanMuted,
    backgroundColor: 'rgba(56, 217, 255, 0.08)',
  },
  statusDone: {
    borderColor: 'rgba(92, 255, 181, 0.45)',
    backgroundColor: 'rgba(92, 255, 181, 0.08)',
  },
  statusText: {
    color: palette.textSecondary,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  metaPill: {
    borderRadius: radii.full,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.frostStrong,
    backgroundColor: palette.frost,
  },
  cta: {
    marginTop: spacing.lg,
  },
});
