import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BetaDisclaimer } from '@/components/ui/BetaDisclaimer';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { ScreenLoading } from '@/components/ui/ScreenStates';
import { VoxaText } from '@/components/ui/VoxaText';
import { palette, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth/AuthContext';
import { getCoachLevel } from '@/lib/progress/levels';
import { useProgress } from '@/lib/progress/useProgress';

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { progress, progressHydrated } = useProgress();

  if (!progressHydrated) {
    return <ScreenLoading message="Loading progress…" />;
  }

  const xp = progress?.xp ?? 0;
  const streak = progress?.streak ?? 0;
  const level = getCoachLevel(xp);
  const progressWidth = `${Math.round(level.progress * 100)}%` as `${number}%`;

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}>
        <VoxaText variant="caption" style={styles.overline}>
          Your momentum
        </VoxaText>
        <VoxaText variant="hero">Keep showing up.</VoxaText>
        <VoxaText variant="body" style={styles.intro}>
          Voxa rewards completed practice, not perfect answers. The goal is to make speaking feel more automatic over time.
        </VoxaText>

        <GlassPanel style={styles.levelCard} intensity={34}>
          <View style={styles.levelTop}>
            <View style={styles.levelCopy}>
              <VoxaText variant="caption">Current level</VoxaText>
              <VoxaText variant="title" style={styles.levelName}>
                {level.current.name}
              </VoxaText>
            </View>
            <View style={styles.xpPill}>
              <VoxaText variant="caption" style={styles.xpPillText}>
                {xp} XP
              </VoxaText>
            </View>
          </View>

          <VoxaText variant="body">{level.current.message}</VoxaText>

          <View
            style={styles.track}
            accessibilityRole="progressbar"
            accessibilityValue={{
              min: 0,
              max: 100,
              now: Math.round(level.progress * 100),
            }}>
            <View style={[styles.fill, { width: progressWidth }]} />
          </View>

          <VoxaText variant="caption" style={styles.levelFootnote}>
            {level.next
              ? `${level.remainingXp} XP to ${level.next.name}`
              : 'Top level reached — keep the habit alive.'}
          </VoxaText>
        </GlassPanel>

        <View style={styles.row}>
          <GlassPanel style={styles.tile}>
            <VoxaText variant="caption" style={styles.metricLabel}>
              Streak
            </VoxaText>
            <VoxaText variant="hero" style={styles.metricValue}>
              {streak}
            </VoxaText>
            <VoxaText variant="muted">practice days</VoxaText>
          </GlassPanel>

          <GlassPanel style={styles.tile}>
            <VoxaText variant="caption" style={styles.metricLabel}>
              Lifetime
            </VoxaText>
            <VoxaText variant="hero" style={styles.metricValue}>
              {xp}
            </VoxaText>
            <VoxaText variant="muted">total XP</VoxaText>
          </GlassPanel>
        </View>

        <VoxaText variant="lead" style={styles.sectionTitle}>
          What matters here
        </VoxaText>

        <GlassPanel style={styles.coachCard}>
          <ProgressPrinciple
            number="01"
            title="Consistency"
            body={streak > 0 ? `You’re on a ${streak}-day run. Protect the habit before chasing longer sessions.` : 'Start with one short session. A repeatable habit beats one marathon practice day.'}
          />
          <View style={styles.divider} />
          <ProgressPrinciple
            number="02"
            title="Range"
            body="Rotate scenarios. Interview confidence and casual conversation use different muscles."
          />
          <View style={styles.divider} />
          <ProgressPrinciple
            number="03"
            title="Recovery"
            body="Getting stuck is part of practice. Rephrase, ask for clarification, and keep the conversation moving."
          />
        </GlassPanel>

        {!user ? (
          <GlassPanel style={styles.syncCard}>
            <VoxaText variant="lead" style={styles.syncTitle}>
              Keep this progress across devices
            </VoxaText>
            <VoxaText variant="muted">
              Sign in from Profile when you want your XP, streak, and conversation history synced to your account.
            </VoxaText>
          </GlassPanel>
        ) : null}

        <BetaDisclaimer compact />
      </ScrollView>
    </GradientBackground>
  );
}

function ProgressPrinciple({ number, title, body }: { number: string; title: string; body: string }) {
  return (
    <View style={styles.principle}>
      <VoxaText variant="caption" style={styles.principleNumber}>
        {number}
      </VoxaText>
      <View style={styles.principleCopy}>
        <VoxaText variant="body" style={styles.principleTitle}>
          {title}
        </VoxaText>
        <VoxaText variant="muted">{body}</VoxaText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
  },
  overline: {
    color: palette.cyan,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  intro: {
    marginTop: spacing.sm,
    maxWidth: 350,
  },
  levelCard: {
    marginTop: spacing.xl,
    borderRadius: radii.xl,
  },
  levelTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  levelCopy: {
    flex: 1,
    gap: 2,
  },
  levelName: {
    color: palette.textPrimary,
  },
  xpPill: {
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.cyanMuted,
    backgroundColor: 'rgba(56, 217, 255, 0.08)',
  },
  xpPillText: {
    color: palette.cyan,
    fontWeight: '700',
  },
  track: {
    height: 8,
    borderRadius: radii.full,
    overflow: 'hidden',
    backgroundColor: palette.frostStrong,
    marginTop: spacing.lg,
  },
  fill: {
    height: '100%',
    borderRadius: radii.full,
    backgroundColor: palette.cyan,
  },
  levelFootnote: {
    marginTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  tile: {
    flex: 1,
    minHeight: 132,
  },
  metricLabel: {
    marginBottom: spacing.xs,
  },
  metricValue: {
    marginBottom: 4,
    fontSize: 40,
    lineHeight: 44,
  },
  sectionTitle: {
    color: palette.textPrimary,
    fontWeight: '700',
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
  },
  coachCard: {
    gap: spacing.md,
  },
  principle: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  principleNumber: {
    color: palette.cyan,
    fontWeight: '700',
    width: 24,
  },
  principleCopy: {
    flex: 1,
    gap: 2,
  },
  principleTitle: {
    color: palette.textPrimary,
    fontWeight: '700',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: palette.frostStrong,
    marginVertical: spacing.sm,
  },
  syncCard: {
    marginTop: spacing.md,
  },
  syncTitle: {
    color: palette.textPrimary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
});
