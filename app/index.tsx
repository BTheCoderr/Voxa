import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { BetaDisclaimer } from '@/components/ui/BetaDisclaimer';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { VoxaText } from '@/components/ui/VoxaText';
import { palette, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth/AuthContext';
import { getOnboardingComplete } from '@/lib/onboarding/storage';

export default function Index() {
  const { initialized } = useAuth();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    if (!initialized) return;
    void (async () => {
      setOnboardingComplete(await getOnboardingComplete());
    })();
  }, [initialized]);

  if (!initialized || onboardingComplete === null) {
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
