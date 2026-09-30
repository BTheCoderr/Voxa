import { router } from 'expo-router';
import { Alert, ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BetaDisclaimer } from '@/components/ui/BetaDisclaimer';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { VoxaButton } from '@/components/ui/VoxaButton';
import { VoxaText } from '@/components/ui/VoxaText';
import { palette, spacing } from '@/constants/theme';
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
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}>
        <VoxaText variant="caption" style={styles.overline}>
          Voxa
        </VoxaText>
        <VoxaText variant="hero">Your space.</VoxaText>
        <VoxaText variant="body" style={styles.intro}>
          Keep practice history synced, manage your session, and find the important account links in one place.
        </VoxaText>

        <GlassPanel style={styles.accountCard}>
          <VoxaText variant="caption" style={styles.cardLabel}>
            Account
          </VoxaText>
          <VoxaText variant="body">
            {user
              ? `Signed in as ${user.email ?? user.id}`
              : 'Practicing locally. Sign in whenever you want progress and history to follow you across devices.'}
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
          Practice & data
        </VoxaText>
        <View style={styles.links}>
          <ProfileLink
            label="Conversation history"
            detail="Review recent sessions and summaries"
            onPress={() => router.push('/(app)/history')}
          />
        </View>

        <VoxaText variant="lead" style={styles.section}>
          Legal
        </VoxaText>
        <View style={styles.links}>
          <ProfileLink label="Privacy" onPress={() => router.push('/legal/privacy')} />
          <ProfileLink label="Terms" onPress={() => router.push('/legal/terms')} />
        </View>

        <BetaDisclaimer />

        <Pressable onPress={() => router.push('/(app)/debug-health')} style={styles.debugHit}>
          <VoxaText variant="caption" style={styles.debug}>
            Diagnostics
          </VoxaText>
        </Pressable>
      </ScrollView>
    </GradientBackground>
  );
}

function ProfileLink({
  label,
  detail,
  onPress,
}: {
  label: string;
  detail?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.linkRow, pressed && styles.linkPressed]}>
      <View style={styles.linkCopy}>
        <VoxaText variant="body" style={styles.link}>
          {label}
        </VoxaText>
        {detail ? <VoxaText variant="caption">{detail}</VoxaText> : null}
      </View>
      <VoxaText variant="body" style={styles.chevron}>
        ›
      </VoxaText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  overline: {
    color: palette.cyan,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  intro: {
    marginTop: spacing.sm,
  },
  accountCard: {
    marginTop: spacing.xl,
  },
  cardLabel: {
    color: palette.cyan,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  section: {
    color: palette.textPrimary,
    fontWeight: '700',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  links: {
    gap: spacing.sm,
  },
  linkRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.frost,
  },
  linkPressed: {
    opacity: 0.7,
  },
  linkCopy: {
    flex: 1,
    gap: 2,
  },
  link: {
    color: palette.textPrimary,
    fontWeight: '600',
  },
  chevron: {
    color: palette.cyan,
    fontSize: 24,
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
