import { Linking, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GradientBackground } from '@/components/ui/GradientBackground';
import { VoxaText } from '@/components/ui/VoxaText';
import { LEGAL } from '@/constants/legal';
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
          By using Voxa you agree to these terms. If you do not agree, please do not use the app.
        </VoxaText>

        <VoxaText variant="lead" style={styles.h2}>
          Practice tool
        </VoxaText>
        <VoxaText variant="body" style={styles.p}>
          Voxa is a speaking practice app with AI-generated responses. It does not provide certified language exams,
          legal, immigration, or professional human tutoring. AI output may be inaccurate — use your judgment in real
          situations.
        </VoxaText>

        <VoxaText variant="lead" style={styles.h2}>
          Free service
        </VoxaText>
        <VoxaText variant="body" style={styles.p}>
          This version of Voxa is free. There are no in-app purchases or paid subscriptions in the current release.
          Optional voice playback is subject to reasonable daily usage limits.
        </VoxaText>

        <VoxaText variant="lead" style={styles.h2}>
          Account
        </VoxaText>
        <VoxaText variant="body" style={styles.p}>
          Creating an account is free. You are responsible for keeping your sign-in credentials secure. You may delete
          your account at any time from Profile → Delete account.
        </VoxaText>

        <VoxaText variant="lead" style={styles.h2}>
          Contact
        </VoxaText>
        <Pressable onPress={() => void Linking.openURL(`mailto:${LEGAL.supportEmail}`)}>
          <VoxaText variant="body" style={styles.link}>
            {LEGAL.supportEmail}
          </VoxaText>
        </Pressable>
        <Pressable onPress={() => void Linking.openURL(LEGAL.termsUrl)}>
          <VoxaText variant="body" style={styles.link}>
            Full terms on the web
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
