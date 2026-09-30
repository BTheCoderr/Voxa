import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BetaDisclaimer } from '@/components/ui/BetaDisclaimer';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { VoxaButton } from '@/components/ui/VoxaButton';
import { VoxaText } from '@/components/ui/VoxaText';
import { getScenario, type ScenarioId } from '@/constants/scenarios';
import { palette, radii, spacing } from '@/constants/theme';
import { openScenarioPractice } from '@/lib/ai/openPractice';
import { trackEvent } from '@/lib/analytics/track';
import { useAuth } from '@/lib/auth/AuthContext';
import type { ConversationJournalEntry } from '@/lib/db/conversations';
import { getConversationJournalEntry } from '@/lib/db/conversations';
import { learningPathLabel, parseApiLearningPath } from '@/lib/learningPath/display';
import { parseStoredCoachReview } from '@/lib/progress/coachMemory';
import { coachSkillLabel } from '@/lib/progress/coachSkills';
import { fromApiLearningPath } from '@/lib/realtime/learningPath';
import { supabase } from '@/lib/supabase/client';

function formatSessionWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatDuration(startedAt: string, endedAt: string | null): string | null {
  if (!endedAt) return null;
  const start = Date.parse(startedAt);
  const end = Date.parse(endedAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;

  const totalSeconds = Math.round((end - start) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes <= 0) return `${seconds}s`;
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

export default function CoachingJournalEntryScreen() {
  const insets = useSafeAreaInsets();
  const { conversationId } = useLocalSearchParams<{ conversationId?: string }>();
  const { user, initialized } = useAuth();
  const [entry, setEntry] = useState<ConversationJournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const id = typeof conversationId === 'string' ? conversationId : '';

  const load = useCallback(async () => {
    if (!user?.id || !id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await getConversationJournalEntry(supabase, user.id, id);
      setEntry(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load this journal entry.');
    } finally {
      setLoading(false);
    }
  }, [id, user?.id]);

  useEffect(() => {
    if (initialized) void load();
  }, [initialized, load]);

  const review = useMemo(
    () => (entry ? parseStoredCoachReview(entry.coach_review) : null),
    [entry],
  );

  const learningPath = entry ? parseApiLearningPath(entry.learning_path) : null;
  const originalScenario = entry ? getScenario(entry.scenario_id as ScenarioId) : null;
  const recommendedScenario = review
    ? getScenario(review.suggestedScenarioId as ScenarioId)
    : originalScenario;
  const duration = entry ? formatDuration(entry.started_at, entry.ended_at) : null;

  const practiceAgain = useCallback(() => {
    if (!entry || !recommendedScenario || !learningPath) return;

    trackEvent('coaching_journal_replay', {
      conversation_id: entry.id,
      source_scenario_id: entry.scenario_id,
      replay_scenario_id: recommendedScenario.id,
      has_structured_review: Boolean(review),
    });

    openScenarioPractice(recommendedScenario.id, fromApiLearningPath(learningPath), {
      focus: review?.focus,
      mission: review?.nextMission,
    });
  }, [entry, learningPath, recommendedScenario, review]);

  if (!initialized || loading) {
    return (
      <GradientBackground>
        <View style={[styles.center, { paddingTop: insets.top + spacing.xl }]}>
          <ActivityIndicator color={palette.cyan} />
          <VoxaText variant="body">Opening your coaching notes…</VoxaText>
        </View>
      </GradientBackground>
    );
  }

  if (!user) {
    return (
      <GradientBackground>
        <View style={[styles.center, { paddingHorizontal: spacing.xl }]}>
          <VoxaText variant="title">Sign in to open your journal.</VoxaText>
          <VoxaText variant="muted" style={styles.centerText}>
            Coaching Journal entries are tied to your synced practice history.
          </VoxaText>
          <VoxaButton title="Go to profile" onPress={() => router.replace('/(app)/(tabs)/profile')} />
        </View>
      </GradientBackground>
    );
  }

  if (error || !entry) {
    return (
      <GradientBackground>
        <View style={[styles.center, { paddingHorizontal: spacing.xl }]}>
          <VoxaText variant="title">Couldn’t open this session.</VoxaText>
          <VoxaText variant="muted" style={styles.centerText}>
            {error ?? 'This coaching entry is unavailable.'}
          </VoxaText>
          <VoxaButton title="Try again" onPress={() => void load()} />
          <VoxaButton title="Back to journal" variant="ghost" onPress={() => router.back()} />
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}>
        <VoxaText variant="caption" style={styles.overline}>
          Coaching journal
        </VoxaText>
        <VoxaText variant="hero">{entry.scenario_title}</VoxaText>
        <VoxaText variant="muted">
          {formatSessionWhen(entry.started_at)}
          {learningPath ? ` · ${learningPathLabel(learningPath)}` : ''}
        </VoxaText>

        <View style={styles.statsRow}>
          {duration ? <StatPill label="Duration" value={duration} /> : null}
          <StatPill label="XP" value={`+${entry.xp_awarded}`} />
          <StatPill label="Status" value={entry.status === 'completed' ? 'Completed' : 'Ended'} />
        </View>

        {review ? (
          <GlassPanel style={styles.reviewCard} intensity={34}>
            <VoxaText variant="caption" style={styles.sectionOverline}>
              Saved coach recap
            </VoxaText>
            <VoxaText variant="title">{review.headline}</VoxaText>

            <CoachNote
              label={`Strength · ${coachSkillLabel(review.strengthTag)}`}
              body={review.strength}
            />
            <CoachNote
              label={`Focus · ${coachSkillLabel(review.focusTag)}`}
              body={review.focus}
            />

            <View style={styles.mission}>
              <VoxaText variant="caption" style={styles.sectionOverline}>
                Next mission
              </VoxaText>
              <VoxaText variant="lead" style={styles.missionText}>
                {review.nextMission}
              </VoxaText>
            </View>
          </GlassPanel>
        ) : (
          <GlassPanel style={styles.reviewCard}>
            <VoxaText variant="caption" style={styles.sectionOverline}>
              Session summary
            </VoxaText>
            <VoxaText variant="lead">
              {entry.summary ?? 'This older session does not have a structured Coach Recap saved.'}
            </VoxaText>
            <VoxaText variant="muted" style={styles.legacyNote}>
              Newer sessions include saved strengths, focus areas, and next missions automatically.
            </VoxaText>
          </GlassPanel>
        )}

        <View style={styles.sectionHeader}>
          <VoxaText variant="lead" style={styles.sectionTitle}>
            Corrections worth keeping
          </VoxaText>
          <VoxaText variant="caption">
            {entry.corrections.length} {entry.corrections.length === 1 ? 'note' : 'notes'}
          </VoxaText>
        </View>

        {entry.corrections.length > 0 ? (
          <View style={styles.corrections}>
            {entry.corrections.map((correction, index) => (
              <GlassPanel key={correction.id} style={styles.correctionCard}>
                <VoxaText variant="caption" style={styles.correctionNumber}>
                  {String(index + 1).padStart(2, '0')}
                </VoxaText>

                {correction.original ? (
                  <VoxaText
                    variant="body"
                    style={correction.improved ? styles.original : styles.spokenPhrase}>
                    {correction.original}
                  </VoxaText>
                ) : null}

                {correction.improved ? (
                  <VoxaText variant="lead" style={styles.improved}>
                    {correction.improved}
                  </VoxaText>
                ) : null}

                {correction.explanation ? (
                  <VoxaText variant="muted">{correction.explanation}</VoxaText>
                ) : !correction.original && correction.body ? (
                  <VoxaText variant="body">{correction.body}</VoxaText>
                ) : null}
              </GlassPanel>
            ))}
          </View>
        ) : (
          <GlassPanel style={styles.emptyCorrections}>
            <VoxaText variant="muted">
              No saved correction cards from this session. The recap above is still available for replay.
            </VoxaText>
          </GlassPanel>
        )}

        {recommendedScenario && learningPath ? (
          <GlassPanel style={styles.replayCard} intensity={34}>
            <VoxaText variant="caption" style={styles.sectionOverline}>
              Replay with purpose
            </VoxaText>
            <VoxaText variant="lead" style={styles.replayTitle}>
              {review ? 'Practice this weakness again' : 'Replay this scenario'}
            </VoxaText>
            <VoxaText variant="muted">
              {review
                ? `Voxa saved ${recommendedScenario.title.toLowerCase()} as the best next rep for this coaching note.`
                : `Run ${recommendedScenario.title.toLowerCase()} again and compare how it feels now.`}
            </VoxaText>
            <VoxaButton
              title={review ? 'Practice this focus' : 'Practice again'}
              onPress={practiceAgain}
              containerStyle={styles.replayButton}
            />
          </GlassPanel>
        ) : null}

        <BetaDisclaimer compact />

        <VoxaButton title="Back to journal" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </GradientBackground>
  );
}

function CoachNote({ label, body }: { label: string; body: string }) {
  return (
    <View style={styles.coachNote}>
      <VoxaText variant="caption" style={styles.noteLabel}>
        {label}
      </VoxaText>
      <VoxaText variant="body">{body}</VoxaText>
    </View>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statPill}>
      <VoxaText variant="caption" style={styles.statLabel}>
        {label}
      </VoxaText>
      <VoxaText variant="caption" style={styles.statValue}>
        {value}
      </VoxaText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  centerText: {
    textAlign: 'center',
    maxWidth: 320,
  },
  overline: {
    color: palette.cyan,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  statPill: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.frostStrong,
    backgroundColor: palette.frost,
  },
  statLabel: {
    color: palette.textMuted,
  },
  statValue: {
    color: palette.textPrimary,
    fontWeight: '700',
  },
  reviewCard: {
    marginTop: spacing.lg,
    borderRadius: radii.xl,
  },
  sectionOverline: {
    color: palette.cyan,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  coachNote: {
    marginTop: spacing.lg,
    gap: 3,
  },
  noteLabel: {
    color: palette.cyan,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mission: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(56, 217, 255, 0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.cyanMuted,
  },
  missionText: {
    color: palette.textPrimary,
    fontWeight: '700',
  },
  legacyNote: {
    marginTop: spacing.md,
  },
  sectionHeader: {
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  sectionTitle: {
    color: palette.textPrimary,
    fontWeight: '700',
  },
  corrections: {
    gap: spacing.sm,
  },
  correctionCard: {
    borderRadius: radii.lg,
  },
  correctionNumber: {
    color: palette.cyan,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  original: {
    textDecorationLine: 'line-through',
    color: palette.textMuted,
  },
  spokenPhrase: {
    color: palette.textPrimary,
  },
  improved: {
    color: palette.textPrimary,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 3,
  },
  emptyCorrections: {
    borderRadius: radii.lg,
  },
  replayCard: {
    marginTop: spacing.xxl,
    borderRadius: radii.xl,
  },
  replayTitle: {
    color: palette.textPrimary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  replayButton: {
    marginTop: spacing.lg,
  },
});
