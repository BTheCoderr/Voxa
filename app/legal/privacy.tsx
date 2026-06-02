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
        <VoxaText variant="title">Privacy</VoxaText>
        <VoxaText variant="body" style={styles.p}>
          This in-app summary describes how Voxa handles your data. Your App Store listing should link to the same policy
          on the web.
        </VoxaText>
        <VoxaText variant="lead" style={styles.h2}>
          What we collect today
        </VoxaText>
        <VoxaText variant="body" style={styles.p}>
          Voxa may process text you type for AI practice, optional voice playback, account data in Supabase when you sign
          in, and product analytics if enabled in your build.
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
