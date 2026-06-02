import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { GradientBackground } from '@/components/ui/GradientBackground';
import { VoxaButton } from '@/components/ui/VoxaButton';
import { VoxaText } from '@/components/ui/VoxaText';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { spacing } from '@/constants/theme';
import { trackEvent } from '@/lib/analytics/track';
import { isGuidedLessonsEnabled } from '@/lib/lessons/guidedLessonsEnabled';
import { setOnboardingComplete } from '@/lib/onboarding/storage';

export default function MicrophoneScreen() {
  return (
    <GradientBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <VoxaText variant="caption" style={styles.overline}>
            Step 3 of 3
          </VoxaText>
          <VoxaText variant="title">Practice on your terms</VoxaText>
          <VoxaText variant="body">
            Most practice happens by typing your responses. If a session needs your microphone, we will ask for permission
            when you start it.
          </VoxaText>
        </View>

        <GlassPanel>
          <VoxaText variant="lead">A note on privacy</VoxaText>
          <VoxaText variant="body" style={styles.note}>
            Audio is used to power your session and improve feedback. Treat this like a rehearsal studio: calm, focused, and yours.
          </VoxaText>
        </GlassPanel>


        <VoxaButton
          title={isGuidedLessonsEnabled() ? 'Continue to setup' : 'Enter Voxa'}
          onPress={async () => {
            await setOnboardingComplete(true);
            trackEvent('onboarding_completed');
            router.replace(isGuidedLessonsEnabled() ? '/(onboarding)/guided' : '/(app)/(tabs)');
          }}
        />
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
    justifyContent: 'space-between',
  },
  header: {
    gap: spacing.sm,
  },
  overline: {
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  note: {
    marginTop: spacing.sm,
  },
});
