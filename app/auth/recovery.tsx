import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BetaDisclaimer } from '@/components/ui/BetaDisclaimer';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { VoxaButton } from '@/components/ui/VoxaButton';
import { VoxaText } from '@/components/ui/VoxaText';
import { palette, spacing } from '@/constants/theme';
import { trackEvent } from '@/lib/analytics/track';
import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase/client';

type Phase = 'checking' | 'ready' | 'saving' | 'error';

export default function PasswordRecoveryScreen() {
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<Phase>('checking');
  const [message, setMessage] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  useEffect(() => {
    let active = true;

    void (async () => {
      if (!env.supabaseConfigured) {
        if (active) {
          setMessage('Password recovery is not configured in this build.');
          setPhase('error');
        }
        return;
      }

      const { data, error } = await supabase.auth.getSession();
      if (!active) return;

      if (error || !data.session) {
        setMessage('This reset session is missing or expired. Request a new password reset email.');
        setPhase('error');
        return;
      }

      setPhase('ready');
    })();

    return () => {
      active = false;
    };
  }, []);

  const savePassword = async () => {
    if (phase === 'saving') return;
    if (password.length < 6) {
      setMessage('Use at least 6 characters for your new password.');
      return;
    }
    if (password !== confirm) {
      setMessage('The passwords do not match.');
      return;
    }

    setPhase('saving');
    setMessage(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage(error.message || 'Could not update your password.');
      setPhase('ready');
      trackEvent('password_recovery_password_updated', { ok: false });
      return;
    }

    trackEvent('password_recovery_password_updated', { ok: true });
    router.replace('/');
  };

  if (phase === 'checking') {
    return (
      <GradientBackground>
        <View
          style={[
            styles.center,
            { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
          ]}>
          <ActivityIndicator size="large" color={palette.cyan} />
          <VoxaText variant="title">Preparing password reset…</VoxaText>
          <VoxaText variant="muted" style={styles.centerText}>
            Checking your secure recovery session.
          </VoxaText>
        </View>
      </GradientBackground>
    );
  }

  if (phase === 'error') {
    return (
      <GradientBackground>
        <View
          style={[
            styles.center,
            { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
          ]}>
          <VoxaText variant="title">Couldn’t reset the password</VoxaText>
          <VoxaText variant="body" style={styles.centerText}>
            {message ?? 'Request a new password reset email.'}
          </VoxaText>
          <VoxaButton title="Back to sign in" onPress={() => router.replace('/(auth)/sign-in')} />
          <BetaDisclaimer compact />
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        keyboardVerticalOffset={insets.top + 8}>
        <View
          style={[
            styles.wrap,
            { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.xl },
          ]}>
          <VoxaText variant="title">Choose a new password</VoxaText>
          <VoxaText variant="body">
            Set a new password for your Voxa account. You’ll stay signed in after the update.
          </VoxaText>

          <TextInput
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              if (message) setMessage(null);
            }}
            autoCapitalize="none"
            autoComplete="password-new"
            secureTextEntry
            placeholder="New password (6+ characters)"
            placeholderTextColor={palette.textMuted}
            style={styles.input}
          />

          <TextInput
            value={confirm}
            onChangeText={(value) => {
              setConfirm(value);
              if (message) setMessage(null);
            }}
            autoCapitalize="none"
            autoComplete="password-new"
            secureTextEntry
            placeholder="Confirm new password"
            placeholderTextColor={palette.textMuted}
            style={styles.input}
            onSubmitEditing={() => void savePassword()}
          />

          {message ? (
            <VoxaText variant="body" style={styles.error}>
              {message}
            </VoxaText>
          ) : null}

          <VoxaButton
            title={phase === 'saving' ? 'Updating password…' : 'Update password'}
            disabled={phase === 'saving' || !password || !confirm}
            onPress={() => void savePassword()}
          />
          <BetaDisclaimer compact />
        </View>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  wrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  centerText: {
    textAlign: 'center',
    maxWidth: 340,
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
});
