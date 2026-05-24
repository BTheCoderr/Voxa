import { StyleSheet, View } from 'react-native';

import { VoxaSplashScreen } from '@/components/splash/VoxaSplashScreen';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { VoxaButton } from '@/components/ui/VoxaButton';
import { VoxaText } from '@/components/ui/VoxaText';
import { spacing } from '@/constants/theme';

export function ScreenLoading({ message = 'Preparing your practice space…' }: { message?: string }) {
  return <VoxaSplashScreen message={message} />;
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
