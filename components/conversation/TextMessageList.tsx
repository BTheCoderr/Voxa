import type { ReactNode, RefObject } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { VoxaText } from '@/components/ui/VoxaText';
import { palette, radii, spacing } from '@/constants/theme';

export type TextChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

type Props = {
  messages: TextChatMessage[];
  listRef?: RefObject<ScrollView | null>;
  footer?: ReactNode;
};

export function TextMessageList({ messages, listRef, footer }: Props) {
  if (messages.length === 0 && !footer) return null;

  return (
    <ScrollView
      ref={listRef}
      style={styles.list}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator
      nestedScrollEnabled>
      {messages.map((m) => (
        <View
          key={m.id}
          style={[styles.bubble, m.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
          <VoxaText variant="caption" style={styles.role}>
            {m.role === 'user' ? 'You' : 'Voxa'}
          </VoxaText>
          <VoxaText variant="body" style={styles.text}>
            {m.text}
          </VoxaText>
        </View>
      ))}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    minHeight: 0,
  },
  content: {
    flexGrow: 1,
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingBottom: spacing.md,
  },
  footer: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  bubble: {
    borderRadius: radii.md,
    padding: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    flexShrink: 1,
  },
  userBubble: {
    alignSelf: 'flex-end',
    maxWidth: '88%',
    backgroundColor: 'rgba(56, 217, 255, 0.12)',
    borderColor: 'rgba(56, 217, 255, 0.35)',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    maxWidth: '92%',
    backgroundColor: palette.frost,
    borderColor: palette.frostStrong,
  },
  role: {
    opacity: 0.65,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  text: {
    color: palette.textPrimary,
    flexShrink: 1,
  },
});
