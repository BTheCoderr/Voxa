import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GradientBackground } from '@/components/ui/GradientBackground';
import { VoxaText } from '@/components/ui/VoxaText';
import { spacing } from '@/constants/theme';

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={[
          styles.body,
          { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl },
        ]}>
        <VoxaText variant="title">Privacy (beta placeholder)</VoxaText>
        <VoxaText variant="body" style={styles.p}>
          This screen is a placeholder for TestFlight. Replace the content below with your real privacy policy before App
          Store review.
        </VoxaText>
        <VoxaText variant="lead" style={styles.h2}>
          What we collect today
        </VoxaText>
        <VoxaText variant="body" style={styles.p}>
          During beta, the app may process voice audio for AI practice sessions, store optional account data in Supabase
          when you sign in, and send product analytics if PostHog is configured.
        </VoxaText>
        <VoxaText variant="lead" style={styles.h2}>
          Contact
        </VoxaText>
        <VoxaText variant="body" style={styles.p}>
          List a support email in App Store Connect and match it here when you publish the final policy URL.
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
