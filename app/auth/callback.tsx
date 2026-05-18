import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BetaDisclaimer } from '@/components/ui/BetaDisclaimer';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { VoxaButton } from '@/components/ui/VoxaButton';
import { VoxaText } from '@/components/ui/VoxaText';
import { palette, spacing } from '@/constants/theme';
import { trackEvent } from '@/lib/analytics/track';
import { completeSessionFromUrl } from '@/lib/auth/completeSessionFromUrl';
import { env } from '@/lib/env';

type Phase = 'working' | 'redirecting' | 'error';

const REDIRECT_MS = 450;
const TIMEOUT_MS = 12_000;

export default function AuthCallbackScreen() {
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<Phase>('working');
  const [message, setMessage] = useState<string | null>(null);
  const handledRef = useRef(false);
  const processingRef = useRef(false);

  useEffect(() => {
    let alive = true;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const clearTimer = () => {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }
    };

    const finishOk = () => {
      if (!alive || handledRef.current) return;
      handledRef.current = true;
      clearTimer();
      setPhase('redirecting');
      trackEvent('auth_magic_link_completed', { ok: true });
      setTimeout(() => {
        router.replace('/');
      }, REDIRECT_MS);
    };

    const finishErr = (msg: string) => {
      if (!alive || handledRef.current) return;
      handledRef.current = true;
      clearTimer();
      setPhase('error');
      setMessage(msg);
      trackEvent('auth_magic_link_completed', { ok: false });
    };

    const consumeUrl = async (url: string | null) => {
      if (!alive || handledRef.current || processingRef.current) return;
      if (!url) return;

      clearTimer();
      processingRef.current = true;
      try {
        const result = await completeSessionFromUrl(url);
        if (!alive || handledRef.current) return;
        if (result.ok) {
          finishOk();
        } else {
          finishErr(result.message);
        }
      } finally {
        processingRef.current = false;
      }
    };

    if (!env.supabaseConfigured) {
      finishErr('Sign-in is not configured in this build. Check your Supabase environment variables.');
      return () => {
        alive = false;
        clearTimer();
      };
    }

    void (async () => {
      let initial = await Linking.getInitialURL();
      if (!initial) {
        await new Promise((r) => setTimeout(r, 300));
        if (!alive) return;
        initial = await Linking.getInitialURL();
      }
      if (!alive) return;

      if (!initial) {
        finishErr('No sign-in link was opened. Go back and request a new magic link.');
        return;
      }

      await consumeUrl(initial);
    })();

    const sub = Linking.addEventListener('url', ({ url }) => {
      void consumeUrl(url);
    });

    timeoutId = setTimeout(() => {
      if (!alive || handledRef.current) return;
      finishErr('Sign-in is taking too long. Check your connection and try again.');
    }, TIMEOUT_MS);

    return () => {
      alive = false;
      clearTimer();
      sub.remove();
    };
  }, []);

  const headline =
    phase === 'error'
      ? 'Couldn’t complete sign-in'
      : phase === 'redirecting'
        ? 'You’re in'
        : 'Signing you in…';

  const subline =
    phase === 'error'
      ? (message ?? 'Something went wrong.')
      : phase === 'redirecting'
        ? 'Redirecting back to Voxa…'
        : 'Securely connecting your account.';

  return (
    <GradientBackground>
      <View
        style={[
          styles.wrap,
          {
            paddingTop: insets.top + spacing.xxl,
            paddingBottom: insets.bottom + spacing.xl,
          },
        ]}>
        {phase === 'working' || phase === 'redirecting' ? (
          <ActivityIndicator size="large" color={palette.cyan} style={styles.spinner} />
        ) : null}

        <VoxaText variant="title" style={styles.title}>
          {headline}
        </VoxaText>
        <VoxaText variant="body" style={styles.body}>
          {subline}
        </VoxaText>

        {phase === 'error' ? (
          <View style={styles.actions}>
            <VoxaButton
              title="Back to sign in"
              onPress={() => router.replace('/(auth)/sign-in')}
              containerStyle={styles.btn}
            />
            <VoxaButton variant="ghost" title="Home" onPress={() => router.replace('/')} containerStyle={styles.btn} />
          </View>
        ) : null}

        <BetaDisclaimer compact />
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    justifyContent: 'center',
  },
  spinner: {
    marginBottom: spacing.md,
  },
  title: {
    textAlign: 'center',
  },
  body: {
    textAlign: 'center',
    opacity: 0.9,
  },
  actions: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  btn: {
    alignSelf: 'stretch',
  },
});
