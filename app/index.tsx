import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { BetaDisclaimer } from '@/components/ui/BetaDisclaimer';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { VoxaText } from '@/components/ui/VoxaText';
import { palette, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth/AuthContext';
import { isGuidedLessonsEnabled } from '@/lib/lessons/guidedLessonsEnabled';
import { getOnboardingComplete } from '@/lib/onboarding/storage';
import {
  isGuidedOnboardingComplete,
  syncGuidedProfileFromRemote,
} from '@/lib/onboarding/guidedProfile';

export default function Index() {
  const { initialized, user } = useAuth();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [guidedComplete, setGuidedComplete] = useState<boolean | null>(null);

  useEffect(() => {
    if (!initialized) return;
    void (async () => {
      if (user?.id) {
        await syncGuidedProfileFromRemote(user.id);
      }
      const [legacy, guided] = await Promise.all([getOnboardingComplete(), isGuidedOnboardingComplete()]);
      setOnboardingComplete(legacy);
      setGuidedComplete(guided);
    })();
  }, [initialized, user?.id]);

  if (!initialized || onboardingComplete === null || guidedComplete === null) {
    return (
      <GradientBackground>
        <View style={styles.boot}>
          <ActivityIndicator size="large" color={palette.cyan} />
          <VoxaText variant="body" style={styles.bootText}>
            Starting Voxa…
          </VoxaText>
          <BetaDisclaimer compact />
        </View>
      </GradientBackground>
    );
  }

  if (!onboardingComplete) {
    return <Redirect href="/(onboarding)/welcome" />;
  }

  if (!guidedComplete && isGuidedLessonsEnabled()) {
    return <Redirect href="/(onboarding)/guided" />;
  }

  return <Redirect href="/(app)/(tabs)" />;
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  bootText: {
    textAlign: 'center',
  },
});
