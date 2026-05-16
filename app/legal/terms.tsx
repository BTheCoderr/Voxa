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
        <VoxaText variant="title">Terms (beta placeholder)</VoxaText>
        <VoxaText variant="body" style={styles.p}>
          Placeholder for TestFlight. Add your full terms of service before production. This beta is provided as-is for
          early feedback.
        </VoxaText>
        <VoxaText variant="lead" style={styles.h2}>
          Practice tool
        </VoxaText>
        <VoxaText variant="body" style={styles.p}>
          Voxa is a speaking practice aid. It is not a certified language test, immigration service, or professional
          tutoring replacement. AI output may be wrong or inappropriate — use your judgment.
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
