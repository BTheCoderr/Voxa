import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabletContent } from '@/components/layout/TabletContent';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { VoxaButton } from '@/components/ui/VoxaButton';
import { VoxaText } from '@/components/ui/VoxaText';
import { palette, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth/AuthContext';
import { clearLocalAppData } from '@/lib/auth/clearLocalAppData';
import { deleteAccountViaEdgeFunction, resolveAccessTokenForDeletion } from '@/lib/auth/deleteAccount';
import { env } from '@/lib/env';
import { setOnboardingComplete } from '@/lib/onboarding/storage';

const CONFIRM_WORD = 'DELETE';

export default function DeleteAccountScreen() {
  const insets = useSafeAreaInsets();
  const { user, session, signOut } = useAuth();
  const [confirmText, setConfirmText] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSubmit =
    acknowledged && confirmText.trim().toUpperCase() === CONFIRM_WORD && !busy && Boolean(user);

  const runDeletion = useCallback(async () => {
    if (!user || !session?.access_token) {
      setErrorMessage('Sign in is required to delete your account.');
      return;
    }

    if (!env.deleteAccountConfigured) {
      setErrorMessage('Account deletion is not available in this build. Contact support.');
      return;
    }

    setBusy(true);
    setErrorMessage(null);

    try {
      const token = await resolveAccessTokenForDeletion(session.access_token);
      await deleteAccountViaEdgeFunction(token);
      await signOut();
      await clearLocalAppData();
      await setOnboardingComplete(false);
      router.replace('/(onboarding)/welcome');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not delete your account.';
      setErrorMessage(msg);
    } finally {
      setBusy(false);
    }
  }, [session?.access_token, signOut, user]);

  const onDeletePress = useCallback(() => {
    Alert.alert(
      'Delete account permanently?',
      'This cannot be undone. Your Voxa account, progress, and practice history will be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: () => void runDeletion(),
        },
      ],
    );
  }, [runDeletion]);

  if (!user) {
    return (
      <GradientBackground>
        <View style={[styles.center, { paddingTop: insets.top + spacing.xl }]}>
          <VoxaText variant="title">Sign in required</VoxaText>
          <VoxaText variant="body" style={styles.centerText}>
            Sign in on the Profile tab to delete your account.
          </VoxaText>
          <VoxaButton title="Back to profile" onPress={() => router.back()} containerStyle={styles.gap} />
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}>
        <View
          style={[
            styles.container,
            { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md },
          ]}>
          <TabletContent fullWidth>
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <VoxaText variant="caption" style={styles.close}>
                Cancel
              </VoxaText>
            </Pressable>

            <VoxaText variant="title" style={styles.title}>
              Delete account
            </VoxaText>
            <VoxaText variant="body" style={styles.warning}>
              This permanently deletes your Voxa account and associated progress and practice history. This action
              cannot be undone.
            </VoxaText>

            <Pressable
              style={styles.checkRow}
              onPress={() => setAcknowledged((v) => !v)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: acknowledged }}>
              <View style={[styles.checkbox, acknowledged && styles.checkboxOn]} />
              <VoxaText variant="body" style={styles.checkLabel}>
                I understand this is permanent and cannot be reversed.
              </VoxaText>
            </Pressable>

            <VoxaText variant="caption" style={styles.typeLabel}>
              Type {CONFIRM_WORD} to confirm
            </VoxaText>
            <TextInput
              value={confirmText}
              onChangeText={setConfirmText}
              placeholder={CONFIRM_WORD}
              placeholderTextColor={palette.textMuted}
              autoCapitalize="characters"
              autoCorrect={false}
              style={styles.input}
              editable={!busy}
            />

            {errorMessage ? (
              <VoxaText variant="body" style={styles.error}>
                {errorMessage}
              </VoxaText>
            ) : null}

            {busy ? (
              <View style={styles.rowCenter}>
                <ActivityIndicator color={palette.cyan} />
                <VoxaText variant="body">Deleting account…</VoxaText>
              </View>
            ) : (
              <VoxaButton
                title="Delete my account"
                variant="ghost"
                disabled={!canSubmit}
                onPress={onDeletePress}
                containerStyle={styles.deleteBtn}
              />
            )}
          </TabletContent>
        </View>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  center: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    gap: spacing.md,
  },
  centerText: {
    textAlign: 'center',
  },
  gap: {
    marginTop: spacing.lg,
  },
  close: {
    color: palette.cyan,
    fontWeight: '600',
  },
  title: {
    marginTop: spacing.sm,
  },
  warning: {
    opacity: 0.95,
    lineHeight: 22,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: palette.frostStrong,
    marginTop: 2,
  },
  checkboxOn: {
    backgroundColor: palette.cyan,
    borderColor: palette.cyan,
  },
  checkLabel: {
    flex: 1,
  },
  typeLabel: {
    marginTop: spacing.md,
    letterSpacing: 0.6,
    opacity: 0.85,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.frostStrong,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: palette.textPrimary,
    fontSize: 16,
  },
  error: {
    color: '#ff8a8a',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  deleteBtn: {
    marginTop: spacing.md,
  },
});
