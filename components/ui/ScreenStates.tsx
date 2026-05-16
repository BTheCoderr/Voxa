import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { GradientBackground } from '@/components/ui/GradientBackground';
import { VoxaButton } from '@/components/ui/VoxaButton';
import { VoxaText } from '@/components/ui/VoxaText';
import { palette, spacing } from '@/constants/theme';

export function ScreenLoading({ message = 'Loading…' }: { message?: string }) {
  return (
    <GradientBackground>
      <View style={styles.center}>
        <ActivityIndicator size="large" color={palette.cyan} />
        <VoxaText variant="body" style={styles.loadingText}>
          {message}
        </VoxaText>
      </View>
    </GradientBackground>
  );
}

export function ScreenEmpty({
  title,
  body,
  actionTitle,
  onAction,
}: {
  title: string;
  body: string;
  actionTitle?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.emptyWrap}>
      <VoxaText variant="title">{title}</VoxaText>
      <VoxaText variant="body" style={styles.emptyBody}>
        {body}
      </VoxaText>
      {actionTitle && onAction ? <VoxaButton title={actionTitle} onPress={onAction} containerStyle={styles.emptyCta} /> : null}
    </View>
  );
}

export function ScreenError({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.emptyWrap}>
      <VoxaText variant="title">{title}</VoxaText>
      <VoxaText variant="body" style={styles.emptyBody}>
        {message}
      </VoxaText>
      {onRetry ? <VoxaButton title="Try again" onPress={onRetry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  loadingText: {
    textAlign: 'center',
  },
  emptyWrap: {
    gap: spacing.md,
  },
  emptyBody: {
    opacity: 0.9,
  },
  emptyCta: {
    marginTop: spacing.sm,
  },
});
