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
          Voxa is built around short speaking-practice sessions. This in-app overview explains the
          main kinds of data the current app can process. The public privacy policy listed with the
          app should contain the full, current terms for a release.
        </VoxaText>

        <VoxaText variant="lead" style={styles.h2}>
          Voice and practice content
        </VoxaText>
        <VoxaText variant="body" style={styles.p}>
          When you start voice practice and grant microphone access, audio is processed to provide
          the realtime conversation. Text practice, transcripts, corrections, coaching recaps, and
          related session data may also be processed to provide feedback and practice history.
          Voxa does not need microphone access when you are not using a voice feature.
        </VoxaText>

        <VoxaText variant="lead" style={styles.h2}>
          Account and progress data
        </VoxaText>
        <VoxaText variant="body" style={styles.p}>
          When you use an account, Voxa can store your email-based account identity, progress,
          completed-session history, conversation messages, corrections, and coaching data through
          Supabase so supported features can sync across sessions and devices.
        </VoxaText>

        <VoxaText variant="lead" style={styles.h2}>
          Service providers
        </VoxaText>
        <VoxaText variant="body" style={styles.p}>
          Depending on the feature and build configuration, Voxa uses services such as Supabase for
          authentication/data, OpenAI for realtime voice, Groq or Gemini for text coaching,
          ElevenLabs for optional voice playback, PostHog for product analytics, and RevenueCat for
          purchase infrastructure. Those providers may process the data needed to deliver their
          part of the service under their own policies and agreements.
        </VoxaText>

        <VoxaText variant="lead" style={styles.h2}>
          Analytics and purchases
        </VoxaText>
        <VoxaText variant="body" style={styles.p}>
          Product analytics are only sent when analytics are configured in the build. Purchase
          infrastructure may also be configured for release builds. Voxa does not use an advertising
          SDK in the current product architecture.
        </VoxaText>

        <VoxaText variant="lead" style={styles.h2}>
          Questions or data requests
        </VoxaText>
        <VoxaText variant="body" style={styles.p}>
          Use the support contact listed on Voxa’s App Store or official product listing for privacy
          questions or account/data requests. Release owners should keep this screen aligned with
          the public Privacy Policy URL.
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
