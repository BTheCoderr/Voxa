import { Linking, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GradientBackground } from '@/components/ui/GradientBackground';
import { VoxaText } from '@/components/ui/VoxaText';
import { LEGAL } from '@/constants/legal';
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
          Voxa helps you practice speaking with AI. This summary explains how we handle your information in the mobile
          app. The full policy is also available on the web.
        </VoxaText>

        <VoxaText variant="lead" style={styles.h2}>
          What we collect
        </VoxaText>
        <VoxaText variant="body" style={styles.p}>
          • Account: email and password when you sign in (stored with Supabase Auth).{'\n'}• Practice: text you type for
          AI coaching and optional voice playback requests.{'\n'}• Progress: lesson completion, XP, streaks, and session
          history when signed in.{'\n'}• Analytics: optional product events if analytics is enabled in your build (no ads).
        </VoxaText>

        <VoxaText variant="lead" style={styles.h2}>
          How we use it
        </VoxaText>
        <VoxaText variant="body" style={styles.p}>
          We use your data to run practice sessions, save progress across devices, improve reliability, and respond to
          support requests. AI processing is handled through our secure backend — API keys for AI providers are not
          stored on your device.
        </VoxaText>

        <VoxaText variant="lead" style={styles.h2}>
          Your choices
        </VoxaText>
        <VoxaText variant="body" style={styles.p}>
          You can sign out anytime from Profile. To permanently delete your account and associated app data, go to Profile
          → Delete account, type DELETE, and confirm.
        </VoxaText>

        <VoxaText variant="lead" style={styles.h2}>
          Contact
        </VoxaText>
        <Pressable onPress={() => void Linking.openURL(`mailto:${LEGAL.supportEmail}`)}>
          <VoxaText variant="body" style={styles.link}>
            {LEGAL.supportEmail}
          </VoxaText>
        </Pressable>
        <Pressable onPress={() => void Linking.openURL(LEGAL.privacyPolicyUrl)}>
          <VoxaText variant="body" style={styles.link}>
            Full privacy policy on the web
          </VoxaText>
        </Pressable>
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
  link: {
    color: '#38D9FF',
    fontWeight: '600',
    lineHeight: 22,
  },
});
