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
        <VoxaText variant="title">Terms of Use</VoxaText>

        <VoxaText variant="lead" style={styles.h2}>
          Speaking-practice tool
        </VoxaText>
        <VoxaText variant="body" style={styles.p}>
          Voxa is an AI-assisted speaking-practice product. It is not a certified language exam,
          immigration service, professional translator, or substitute for qualified instruction
          when accuracy is critical.
        </VoxaText>

        <VoxaText variant="lead" style={styles.h2}>
          AI output can be wrong
        </VoxaText>
        <VoxaText variant="body" style={styles.p}>
          AI-generated replies, corrections, coaching suggestions, difficulty recommendations, and
          progress trends can be incomplete or incorrect. Use your judgment, especially before
          relying on wording in high-stakes professional, legal, medical, financial, or safety
          situations.
        </VoxaText>

        <VoxaText variant="lead" style={styles.h2}>
          Your account
        </VoxaText>
        <VoxaText variant="body" style={styles.p}>
          You are responsible for keeping your sign-in credentials secure and for activity performed
          through your account. Do not use Voxa to submit unlawful, abusive, or harmful content.
        </VoxaText>

        <VoxaText variant="lead" style={styles.h2}>
          Availability and changes
        </VoxaText>
        <VoxaText variant="body" style={styles.p}>
          Voxa depends on network and third-party services, so features may occasionally be
          unavailable, delayed, or changed. Coaching systems, limits, providers, and beta features
          can evolve as the product is improved.
        </VoxaText>

        <VoxaText variant="lead" style={styles.h2}>
          Release terms
        </VoxaText>
        <VoxaText variant="body" style={styles.p}>
          The release owner should keep this in-app overview aligned with the public Terms and
          Privacy URLs supplied with the app. Those published policies should contain the complete
          terms that apply to a public release.
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
