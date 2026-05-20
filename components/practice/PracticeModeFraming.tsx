import { StyleSheet, View } from 'react-native';

import { GlassPanel } from '@/components/ui/GlassPanel';
import { VoxaText } from '@/components/ui/VoxaText';
import { palette, spacing } from '@/constants/theme';
import { isVoicePracticeMode } from '@/lib/ai/mode';

export function PracticeModeFraming() {
  if (isVoicePracticeMode()) {
    return (
      <GlassPanel style={styles.panel}>
        <ModeRow
          badge="Premium"
          title="Live Voice Practice"
          body="Speak naturally — AI responds with voice in real time. Experimental."
          muted
        />
      </GlassPanel>
    );
  }

  return (
    <GlassPanel style={styles.panel}>
      <ModeRow
        badge="Free"
        title="Text Practice"
        body="Type or dictate. AI replies in text with gentle corrections. Saves XP and history."
      />
      <View style={styles.divider} />
      <ModeRow
        badge="Optional"
        title="Text Practice + Voice Playback"
        body='Tap "Hear this response" to listen to a reply — not full voice conversation.'
      />
      <View style={styles.divider} />
      <ModeRow
        badge="Coming soon"
        title="Live Voice Practice"
        body="Speak naturally and AI responds with voice in real time."
        muted
      />
    </GlassPanel>
  );
}

function ModeRow({
  badge,
  title,
  body,
  muted,
}: {
  badge: string;
  title: string;
  body: string;
  muted?: boolean;
}) {
  return (
    <View style={[styles.row, muted && styles.rowMuted]}>
      <View style={styles.badge}>
        <VoxaText variant="caption" style={styles.badgeText}>
          {badge}
        </VoxaText>
      </View>
      <View style={styles.copy}>
        <VoxaText variant="body" style={styles.title}>
          {title}
        </VoxaText>
        <VoxaText variant="muted">{body}</VoxaText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  rowMuted: {
    opacity: 0.72,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: palette.frost,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.frostStrong,
    marginTop: 2,
  },
  badgeText: {
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontWeight: '600',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: palette.frostStrong,
    marginVertical: spacing.xs,
  },
});
