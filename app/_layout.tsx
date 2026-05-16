import { ThemeProvider, DarkTheme } from '@react-navigation/native';
import type { ErrorBoundaryProps } from 'expo-router';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useMemo } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';

import { AnalyticsProvider } from '@/lib/analytics/posthog';
import { trackEvent } from '@/lib/analytics/track';
import { AuthProvider, useAuth } from '@/lib/auth/AuthContext';
import { configureRevenueCat } from '@/lib/purchases/revenuecat';

import { BetaDisclaimer } from '@/components/ui/BetaDisclaimer';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { VoxaButton } from '@/components/ui/VoxaButton';
import { VoxaText } from '@/components/ui/VoxaText';
import { palette, spacing } from '@/constants/theme';

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    trackEvent('app_error_boundary', { message: error.message, name: error.name });
  }, [error]);

  return (
    <GradientBackground>
      <SafeAreaView style={styles.errSafe}>
        <VoxaText variant="caption" style={styles.errBeta}>
          Voxa · TestFlight beta
        </VoxaText>
        <VoxaText variant="title">Something went wrong</VoxaText>
        <VoxaText variant="body" style={styles.errMsg}>
          {error.message}
        </VoxaText>
        <BetaDisclaimer compact />
        <VoxaButton title="Try again" onPress={() => void retry()} containerStyle={styles.errBtn} />
      </SafeAreaView>
    </GradientBackground>
  );
}

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.preventAutoHideAsync();

const VoxaNavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: palette.electricBlue,
    background: palette.void,
    card: palette.deepIndigo,
    text: palette.textPrimary,
    border: palette.frost,
    notification: palette.cyan,
  },
};

export default function RootLayout() {
  useEffect(() => {
    configureRevenueCat();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AnalyticsProvider>
          <RootStack />
        </AnalyticsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function RootStack() {
  const { initialized } = useAuth();

  const stack = useMemo(
    () => (
      <ThemeProvider value={VoxaNavigationTheme}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.void } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
          <Stack.Screen name="legal" />
        </Stack>
      </ThemeProvider>
    ),
    [],
  );

  useEffect(() => {
    if (!initialized) return;
    void SplashScreen.hideAsync();
  }, [initialized]);

  if (!initialized) {
    return null;
  }

  return stack;
}

const styles = StyleSheet.create({
  errSafe: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    justifyContent: 'center',
    gap: spacing.md,
  },
  errBeta: {
    opacity: 0.8,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  errMsg: {
    opacity: 0.95,
  },
  errBtn: {
    marginTop: spacing.lg,
  },
});
