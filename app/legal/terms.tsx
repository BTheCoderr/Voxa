import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GradientBackground } from '@/components/ui/GradientBackground';
import { VoxaText } from '@/components/ui/VoxaText';
import { spacing } from '@/constants/theme';

export default function TermsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={[
          styles.body,
          { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl },
        ]}>
        <VoxaText variant="title">Terms of use</VoxaText>
        <VoxaText variant="body" style={styles.p}>
          By using Voxa you agree to these terms. Replace or supplement this in-app summary with your published terms URL
          in App Store Connect.
        </VoxaText>
        <VoxaText variant="lead" style={styles.h2}>
          Practice tool
        </VoxaText>
        <VoxaText variant="body" style={styles.p}>
          Voxa is a speaking practice app. It does not provide certified language certification, legal, immigration, or
          professional tutoring services. AI output may be inaccurate — use your judgment.
        </VoxaText>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  p: {
    opacity: 0.92,
    lineHeight: 22,
  },
  h2: {
    marginTop: spacing.sm,
  },
});
