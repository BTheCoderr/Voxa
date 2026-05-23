import { StyleSheet, View } from 'react-native';

import { VoxaText } from '@/components/ui/VoxaText';
import { palette, radii, spacing } from '@/constants/theme';

type ChatBubbleProps = {
  role: 'assistant' | 'user';
  children: string;
};

export function ChatBubble({ role, children }: ChatBubbleProps) {
  const isAssistant = role === 'assistant';

  return (
    <View style={[styles.row, isAssistant ? styles.rowAssistant : styles.rowUser]}>
      <View style={[styles.bubble, isAssistant ? styles.bubbleAssistant : styles.bubbleUser]}>
        <VoxaText variant="body">{children}</VoxaText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: spacing.sm,
  },
  rowAssistant: {
    alignItems: 'flex-start',
  },
  rowUser: {
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '88%',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
  },
  bubbleAssistant: {
    backgroundColor: 'rgba(59, 108, 255, 0.22)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.cyanMuted,
    borderTopLeftRadius: radii.sm,
  },
  bubbleUser: {
    backgroundColor: palette.frostStrong,
    borderTopRightRadius: radii.sm,
  },
});
