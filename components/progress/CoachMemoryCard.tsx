import { StyleSheet, View } from 'react-native';

import { GlassPanel } from '@/components/ui/GlassPanel';
import { VoxaButton } from '@/components/ui/VoxaButton';
import { VoxaText } from '@/components/ui/VoxaText';
import { getScenario, type ScenarioId } from '@/constants/scenarios';
import { palette, radii, spacing } from '@/constants/theme';
import type { LearnerCoachMemory } from '@/lib/progress/coachMemory';
import { coachSkillLabel } from '@/lib/progress/coachSkills';

type Props = {
  memory: LearnerCoachMemory;
  languageLabel: string;
  onStartScenario: (scenarioId: ScenarioId) => void;
};

export function CoachMemoryCard({ memory, languageLabel, onStartScenario }: Props) {
  const primaryScenario = memory.recommendedScenarioIds[0]
    ? getScenario(memory.recommendedScenarioIds[0])
    : null;

  return (
    <GlassPanel style={styles.card} intensity={34}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <VoxaText variant="caption" style={styles.overline}>
            Voxa remembers
          </VoxaText>
          <VoxaText variant="title">{memory.headline}</VoxaText>
        </View>
        <View style={styles.memoryPill}>
          <VoxaText variant="caption" style={styles.memoryPillText}>
            {memory.sessionsAnalyzed} {memory.sessionsAnalyzed === 1 ? 'session' : 'sessions'}
          </VoxaText>
        </View>
      </View>

      <VoxaText variant="body" style={styles.summary}>
        {memory.summary}
      </VoxaText>

      {memory.sessionsAnalyzed > 0 ? (
        <View style={styles.skillRow}>
          {memory.primaryFocus ? (
            <SkillPill label="Focus" value={coachSkillLabel(memory.primaryFocus)} />
          ) : null}
          {memory.strongestSkill ? (
            <SkillPill label="Strength" value={coachSkillLabel(memory.strongestSkill)} />
          ) : null}
        </View>
      ) : null}

      <View style={styles.pathRow}>
        <VoxaText variant="caption" style={styles.pathLabel}>
          {languageLabel}
        </VoxaText>
        <VoxaText variant="caption">
          {memory.confidence === 'established'
            ? 'Established pattern'
            : memory.confidence === 'forming'
              ? 'Pattern forming'
              : 'Memory starting'}
        </VoxaText>
      </View>

      {primaryScenario ? (
        <View style={styles.plan}>
          <VoxaText variant="caption" style={styles.planLabel}>
            This week
          </VoxaText>
          <VoxaText variant="lead" style={styles.planTitle}>
            Practice {primaryScenario.title.toLowerCase()}
          </VoxaText>
          <VoxaText variant="muted">
            {memory.primaryFocus
              ? `Use this scenario to put extra reps into ${coachSkillLabel(memory.primaryFocus).toLowerCase()}.`
              : primaryScenario.mission}
          </VoxaText>
          <VoxaButton
            title="Practice this focus"
            onPress={() => onStartScenario(primaryScenario.id)}
            containerStyle={styles.cta}
          />
        </View>
      ) : null}
    </GlassPanel>
  );
}

function SkillPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.skillPill}>
      <VoxaText variant="caption" style={styles.skillLabel}>
        {label}
      </VoxaText>
      <VoxaText variant="caption" style={styles.skillValue}>
        {value}
      </VoxaText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerCopy: {
    flex: 1,
  },
  overline: {
    color: palette.cyan,
    textTransform: 'uppercase',
    letterSpacing: 1.3,
    marginBottom: spacing.xs,
  },
  memoryPill: {
    borderRadius: radii.full,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.cyanMuted,
    backgroundColor: 'rgba(56, 217, 255, 0.08)',
  },
  memoryPillText: {
    color: palette.cyan,
    fontWeight: '700',
  },
  summary: {
    marginTop: spacing.md,
  },
  skillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  skillPill: {
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    backgroundColor: palette.frost,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.frostStrong,
    gap: 2,
  },
  skillLabel: {
    color: palette.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  skillValue: {
    color: palette.textPrimary,
    fontWeight: '700',
  },
  pathRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.frostStrong,
  },
  pathLabel: {
    color: palette.cyan,
    fontWeight: '700',
  },
  plan: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(56, 217, 255, 0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.cyanMuted,
  },
  planLabel: {
    color: palette.cyan,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  planTitle: {
    color: palette.textPrimary,
    fontWeight: '700',
    marginTop: 3,
    marginBottom: spacing.xs,
  },
  cta: {
    marginTop: spacing.md,
  },
});
