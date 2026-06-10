import { Pressable, StyleSheet } from 'react-native';

import { GlassPanel } from '@/components/ui/GlassPanel';
import { VoxaText } from '@/components/ui/VoxaText';
import type { ScenarioStarter } from '@/lib/practice/scenarioStarter';
import { palette, radii, spacing } from '@/constants/theme';

type ScenarioStarterCardProps = {
  starter: ScenarioStarter;
  onUseSuggestedReply?: (text: string) => void;
  /** When false, hides the optional voice-playback hint (TTS unavailable in production). */
  showVoiceHint?: boolean;
};

export function ScenarioStarterCard({
  starter,
  onUseSuggestedReply,
  showVoiceHint = true,
}: ScenarioStarterCardProps) {
  return (
    <GlassPanel style={styles.card}>
      <VoxaText variant="caption" style={styles.label}>
        Your turn
      </VoxaText>
      <VoxaText variant="lead">{starter.starterTitle}</VoxaText>
      <VoxaText variant="body">{starter.starterPrompt}</VoxaText>
      {starter.suggestedUserReply && onUseSuggestedReply ? (
        <Pressable
          onPress={() => onUseSuggestedReply(starter.suggestedUserReply!)}
          style={styles.suggestHit}>
          <VoxaText variant="caption" style={styles.suggestLabel}>
            Try this
          </VoxaText>
          <VoxaText variant="muted" style={styles.suggestText}>
            {starter.suggestedUserReply}
          </VoxaText>
        </Pressable>
      ) : null}
      {showVoiceHint ? (
        <VoxaText variant="caption" style={styles.hint}>
          Tap Hear this response to listen to the latest reply.
        </VoxaText>
      ) : null}
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  label: {
    letterSpacing: 1,
    textTransform: 'uppercase',
    opacity: 0.75,
  },
  suggestHit: {
    marginTop: spacing.xs,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.cyanMuted,
    backgroundColor: palette.frost,
  },
  suggestLabel: {
    color: palette.cyan,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  suggestText: {
    lineHeight: 20,
  },
  hint: {
    opacity: 0.7,
    marginTop: spacing.xs,
  },
});
