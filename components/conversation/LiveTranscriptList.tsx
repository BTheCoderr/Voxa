import { VoxaText } from '@/components/ui/VoxaText';
import { palette, radii, spacing } from '@/constants/theme';
import { ScrollView, StyleSheet, View } from 'react-native';

import type { TranscriptMessage } from '@/lib/realtime/voiceSessionTypes';

type Props = {
  messages: TranscriptMessage[];
};

export function LiveTranscriptList({ messages }: Props) {
  if (messages.length === 0) {
    return (
      <View style={styles.empty}>
        <VoxaText variant="muted" style={styles.emptyText}>
          Transcript will appear as you speak and as Voxa responds.
        </VoxaText>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.inner}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">
      {[...messages].reverse().map((m) => (
        <View
          key={m.id}
          style={[styles.bubble, m.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
          <VoxaText variant="caption" style={styles.label}>
            {m.role === 'user' ? 'You' : 'Voxa'}
          </VoxaText>
          <VoxaText variant="body" style={m.role === 'user' ? styles.userText : styles.assistantText}>
            {m.text}
            {m.partial ? '…' : ''}
          </VoxaText>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    maxHeight: 220,
  },
  inner: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  empty: {
    minHeight: 80,
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
  bubble: {
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxWidth: '92%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(56, 217, 255, 0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(56, 217, 255, 0.35)',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: palette.frost,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.frostStrong,
  },
  label: {
    marginBottom: 4,
    opacity: 0.85,
  },
  userText: {
    color: palette.textPrimary,
  },
  assistantText: {
    color: palette.textSecondary,
  },
});
