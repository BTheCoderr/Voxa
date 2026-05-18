import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BetaDisclaimer } from '@/components/ui/BetaDisclaimer';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { VoxaButton } from '@/components/ui/VoxaButton';
import { VoxaText } from '@/components/ui/VoxaText';
import { palette, spacing } from '@/constants/theme';
import { trackEvent } from '@/lib/analytics/track';
import { env } from '@/lib/env';
import { getAuthMagicLinkRedirectUrl } from '@/lib/auth/magicLinkRedirect';
import { supabase } from '@/lib/supabase/client';

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        keyboardVerticalOffset={insets.top + 8}>
        <View style={[styles.wrap, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.lg }]}>
          <VoxaText variant="title">Sign in</VoxaText>
          <VoxaText variant="body">We will email you a secure magic link to save your progress across devices.</VoxaText>

          {!env.supabaseConfigured ? (
            <VoxaText variant="body" style={styles.warn}>
              Supabase is not configured in this build. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to
              sign in.
            </VoxaText>
          ) : null}

          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor={palette.textMuted}
            placeholder="you@domain.com"
            style={styles.input}
          />

          <VoxaButton
            title={busy ? 'Sending…' : 'Send magic link'}
            disabled={busy || !email.trim() || !env.supabaseConfigured}
            onPress={async () => {
              if (!env.supabaseConfigured) {
                Alert.alert('Supabase not configured', 'Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
                return;
              }
              trackEvent('sign_in_started', { method: 'magic_link' });
              setBusy(true);
              const redirectTo = getAuthMagicLinkRedirectUrl();
              if (__DEV__) {
                // eslint-disable-next-line no-console
                console.log('[auth] signInWithOtp emailRedirectTo →', redirectTo);
              }
              trackEvent('sign_in_magic_link_redirect_to', { redirect_prefix: redirectTo.split(':')[0] ?? '' });
              const { error } = await supabase.auth.signInWithOtp({
                email: email.trim(),
                options: {
                  emailRedirectTo: redirectTo,
                },
              });
              setBusy(false);
              if (error) {
                Alert.alert('Could not send link', error.message);
                return;
              }
              trackEvent('sign_in_completed', { method: 'magic_link' });
              Alert.alert('Check your email', 'We sent you a sign-in link.', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            }}
          />

          <BetaDisclaimer compact />

          <VoxaButton variant="ghost" title="Back" onPress={() => router.back()} containerStyle={styles.back} />
        </View>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  wrap: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  warn: {
    color: palette.cyan,
    opacity: 0.95,
  },
  input: {
    marginTop: spacing.sm,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.frostStrong,
    backgroundColor: palette.frost,
    color: palette.textPrimary,
    fontSize: 16,
  },
  back: {
    marginTop: spacing.md,
  },
});
