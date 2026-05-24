import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BetaDisclaimer } from '@/components/ui/BetaDisclaimer';
import { TabletContent } from '@/components/layout/TabletContent';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { VoxaButton } from '@/components/ui/VoxaButton';
import { VoxaText } from '@/components/ui/VoxaText';
import { palette, spacing } from '@/constants/theme';
import { formatAuthError, validateEmail, validatePassword } from '@/lib/auth/authErrors';
import { getAuthMagicLinkRedirectUrl } from '@/lib/auth/magicLinkRedirect';
import { trackEvent } from '@/lib/analytics/track';
import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase/client';

type AuthMode = 'sign_in' | 'sign_up';

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<AuthMode>('sign_in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [showAltSignIn, setShowAltSignIn] = useState(false);

  const isSignIn = mode === 'sign_in';

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setFieldError(null);
    setPassword('');
  };

  const handlePasswordAuth = async () => {
    if (!env.supabaseConfigured) {
      Alert.alert('Supabase not configured', 'Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
      return;
    }

    const emailErr = validateEmail(email);
    if (emailErr) {
      setFieldError(emailErr);
      return;
    }

    const passwordErr = validatePassword(password, !isSignIn);
    if (passwordErr) {
      setFieldError(passwordErr);
      return;
    }

    setFieldError(null);
    setBusy(true);
    const trimmedEmail = email.trim();

    try {
      if (isSignIn) {
        trackEvent('sign_in_started', { method: 'password' });
        const { error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (error) {
          setFieldError(formatAuthError(error, 'sign_in'));
          return;
        }
        trackEvent('sign_in_completed', { method: 'password' });
        router.replace('/');
        return;
      }

      trackEvent('sign_up_started', { method: 'password' });
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
      });
      if (error) {
        setFieldError(formatAuthError(error, 'sign_up'));
        return;
      }

      if (data.session) {
        trackEvent('sign_up_completed', { method: 'password', confirmed: true });
        router.replace('/');
        return;
      }

      trackEvent('sign_up_completed', { method: 'password', confirmed: false });
      Alert.alert(
        'Check your email',
        'We sent a confirmation link. After confirming, sign in with your password here.',
      );
    } finally {
      setBusy(false);
    }
  };

  const handleMagicLink = async () => {
    if (!env.supabaseConfigured) {
      Alert.alert('Supabase not configured', 'Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
      return;
    }

    const emailErr = validateEmail(email);
    if (emailErr) {
      setFieldError(emailErr);
      return;
    }

    setFieldError(null);
    setBusy(true);
    trackEvent('sign_in_started', { method: 'magic_link' });

    const redirectTo = getAuthMagicLinkRedirectUrl();
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[auth] signInWithOtp emailRedirectTo →', redirectTo);
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    });
    setBusy(false);

    if (error) {
      setFieldError(error.message);
      return;
    }

    trackEvent('sign_in_completed', { method: 'magic_link' });
    Alert.alert('Check your email', 'We sent a sign-in link. Magic link is optional — password sign-in is faster for beta.');
  };

  const primaryLabel = busy
    ? isSignIn
      ? 'Signing in…'
      : 'Creating account…'
    : isSignIn
      ? 'Sign in'
      : 'Create account';

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        keyboardVerticalOffset={insets.top + 8}>
        <View style={[styles.wrap, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.lg }]}>
          <TabletContent fullWidth style={styles.tablet}>
            <VoxaText variant="title">{isSignIn ? 'Sign in' : 'Create account'}</VoxaText>
          <VoxaText variant="body">
            {isSignIn
              ? 'Use your email and password to continue. No redirect links required.'
              : 'Create a test account to save progress across sessions.'}
          </VoxaText>

          {!env.supabaseConfigured ? (
            <VoxaText variant="body" style={styles.warn}>
              Supabase is not configured in this build. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.
            </VoxaText>
          ) : null}

          <View style={styles.modeRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: isSignIn }}
              onPress={() => switchMode('sign_in')}
              style={[styles.modeChip, isSignIn && styles.modeChipActive]}>
              <VoxaText variant="caption" style={[styles.modeLabel, isSignIn && styles.modeLabelActive]}>
                Sign in
              </VoxaText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: !isSignIn }}
              onPress={() => switchMode('sign_up')}
              style={[styles.modeChip, !isSignIn && styles.modeChipActive]}>
              <VoxaText variant="caption" style={[styles.modeLabel, !isSignIn && styles.modeLabelActive]}>
                Create account
              </VoxaText>
            </Pressable>
          </View>

          <TextInput
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              if (fieldError) setFieldError(null);
            }}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholderTextColor={palette.textMuted}
            placeholder="you@domain.com"
            style={styles.input}
          />

          <TextInput
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              if (fieldError) setFieldError(null);
            }}
            autoCapitalize="none"
            autoComplete={isSignIn ? 'password' : 'password-new'}
            secureTextEntry
            placeholderTextColor={palette.textMuted}
            placeholder={isSignIn ? 'Password' : 'Password (6+ characters)'}
            style={styles.input}
            onSubmitEditing={() => void handlePasswordAuth()}
          />

          {fieldError ? (
            <VoxaText variant="body" style={styles.error}>
              {fieldError}
            </VoxaText>
          ) : null}

          <VoxaButton
            title={primaryLabel}
            disabled={busy || !email.trim() || !password || !env.supabaseConfigured}
            onPress={() => void handlePasswordAuth()}
          />

          <Pressable
            accessibilityRole="button"
            onPress={() => setShowAltSignIn((v) => !v)}
            style={styles.altToggle}>
            <VoxaText variant="caption" style={styles.altToggleLabel}>
              {showAltSignIn ? 'Hide other sign-in options' : 'Other sign-in options'}
            </VoxaText>
          </Pressable>

          {showAltSignIn ? (
            <VoxaButton
              variant="ghost"
              title={busy ? 'Sending…' : 'Email me a magic link (optional)'}
              disabled={busy || !email.trim() || !env.supabaseConfigured}
              onPress={() => void handleMagicLink()}
            />
          ) : null}

          <BetaDisclaimer compact />

          <VoxaButton variant="ghost" title="Back" onPress={() => router.back()} containerStyle={styles.back} />
          </TabletContent>
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
  tablet: {
    flex: 1,
    alignSelf: 'stretch',
  },
  warn: {
    color: palette.cyan,
    opacity: 0.95,
  },
  modeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  modeChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.frostStrong,
    backgroundColor: palette.frost,
    alignItems: 'center',
  },
  modeChipActive: {
    borderColor: palette.cyan,
    backgroundColor: 'rgba(56, 217, 255, 0.12)',
  },
  modeLabel: {
    color: palette.textMuted,
  },
  modeLabelActive: {
    color: palette.textPrimary,
  },
  input: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.frostStrong,
    backgroundColor: palette.frost,
    color: palette.textPrimary,
    fontSize: 16,
  },
  error: {
    color: palette.danger,
    fontSize: 14,
    lineHeight: 20,
  },
  back: {
    marginTop: spacing.md,
  },
  altToggle: {
    alignSelf: 'center',
    paddingVertical: spacing.xs,
  },
  altToggleLabel: {
    color: palette.textMuted,
    textDecorationLine: 'underline',
  },
});
