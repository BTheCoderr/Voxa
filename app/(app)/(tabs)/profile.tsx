import { router } from 'expo-router';
import { Alert, ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BetaDisclaimer } from '@/components/ui/BetaDisclaimer';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { VoxaButton } from '@/components/ui/VoxaButton';
import { VoxaText } from '@/components/ui/VoxaText';
import { spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth/AuthContext';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut, initialized } = useAuth();

  if (!initialized) {
    return (
      <GradientBackground>
        <View style={[styles.container, styles.centered, { paddingTop: insets.top + spacing.xl }]}>
          <ActivityIndicator />
          <VoxaText variant="muted">Loading account…</VoxaText>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <View style={[styles.container, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }]}>
        <VoxaText variant="caption" style={styles.overline}>
          TestFlight beta
        </VoxaText>
        <VoxaText variant="caption" style={styles.sub}>
          Account
        </VoxaText>
        <VoxaText variant="title">Your space</VoxaText>

        <GlassPanel>
          <VoxaText variant="body">
            {user ? `Signed in as ${user.email ?? user.id}` : 'You are practicing locally. Sign in to sync progress when you are ready.'}
          </VoxaText>

          {!user ? (
            <VoxaButton title="Sign in" onPress={() => router.push('/(auth)/sign-in')} containerStyle={styles.cta} />
          ) : (
            <VoxaButton
              variant="ghost"
              title="Sign out"
              containerStyle={styles.cta}
              onPress={async () => {
                await signOut();
                Alert.alert('Signed out', 'Your device session has been cleared.');
              }}
            />
          )}
        </GlassPanel>

        <VoxaText variant="lead" style={styles.section}>
          Legal
        </VoxaText>
        <View style={styles.links}>
          <Pressable onPress={() => router.push('/legal/privacy')}>
            <VoxaText variant="body" style={styles.link}>
              Privacy
            </VoxaText>
          </Pressable>
          <Pressable onPress={() => router.push('/legal/terms')}>
            <VoxaText variant="body" style={styles.link}>
              Terms
            </VoxaText>
          </Pressable>
        </View>

        <BetaDisclaimer />

        <Pressable onPress={() => router.push('/(app)/debug-health')} style={styles.debugHit}>
          <VoxaText variant="caption" style={styles.debug}>
            Diagnostics for testers
          </VoxaText>
        </Pressable>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  overline: {
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    opacity: 0.85,
  },
  sub: {
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  section: {
    marginTop: spacing.md,
  },
  links: {
    gap: spacing.sm,
  },
  link: {
    color: '#38D9FF',
    fontWeight: '600',
  },
  cta: {
    marginTop: spacing.md,
  },
  debugHit: {
    marginTop: 'auto',
    paddingVertical: spacing.md,
  },
  debug: {
    opacity: 0.55,
  },
});
