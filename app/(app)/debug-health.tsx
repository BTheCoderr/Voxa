import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassPanel } from '@/components/ui/GlassPanel';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { VoxaButton } from '@/components/ui/VoxaButton';
import { VoxaText } from '@/components/ui/VoxaText';
import { spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth/AuthContext';
import { getLastRealtimeError } from '@/lib/diagnostics/realtimeErrors';
import { env } from '@/lib/env';
import { getAudioStreamModule } from '@/lib/realtime/audioStreamModule';

function boolLabel(v: boolean): string {
  return v ? 'Yes' : 'No';
}

export default function DebugHealthScreen() {
  const insets = useSafeAreaInsets();
  const { user, initialized } = useAuth();
  const [micStatus, setMicStatus] = useState<string>('…');
  const [lastErr, setLastErr] = useState<ReturnType<typeof getLastRealtimeError>>(null);

  const refresh = useCallback(async () => {
    setLastErr(getLastRealtimeError());
    if (Platform.OS === 'web') {
      setMicStatus('Web (voice not supported)');
      return;
    }
    const audio = getAudioStreamModule();
    if (!audio) {
      setMicStatus('No native audio module (use dev build, not Expo Go)');
      return;
    }
    try {
      const r = await audio.ExpoPlayAudioStream.getPermissionsAsync();
      if (r.granted) setMicStatus('Granted');
      else if (r.canAskAgain === false) setMicStatus('Blocked / must open Settings');
      else setMicStatus('Not granted (can request)');
    } catch {
      setMicStatus('Unknown (permission check failed)');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const version = Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? '—';
  const build =
    Constants.nativeBuildVersion ??
    Constants.expoConfig?.ios?.buildNumber ??
    (Constants.expoConfig?.android?.versionCode != null ? String(Constants.expoConfig.android.versionCode) : '—');

  const bundleId =
    Constants.expoConfig?.ios?.bundleIdentifier ??
    Constants.expoConfig?.android?.package ??
    '—';

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={[
          styles.wrap,
          { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl },
        ]}>
        <VoxaText variant="caption" style={styles.over}>
          Diagnostics
        </VoxaText>
        <VoxaText variant="title">Health check</VoxaText>
        <VoxaText variant="muted">For beta testers and builders. Not shown to end users in marketing.</VoxaText>

        <GlassPanel style={styles.card}>
          <Row label="Supabase configured" value={boolLabel(env.supabaseConfigured)} />
          <Row label="Signed in" value={initialized ? boolLabel(Boolean(user)) : '…'} />
          <Row label="Realtime session URL" value={boolLabel(env.realtimeSessionConfigured)} />
          <Row label="PostHog key" value={boolLabel(Boolean(env.posthogKey))} />
        </GlassPanel>

        <GlassPanel style={[styles.card, styles.mono]}>
          <VoxaText variant="caption" style={styles.monoLabel}>
            Microphone permission
          </VoxaText>
          <VoxaText variant="body">{micStatus}</VoxaText>
        </GlassPanel>

        <GlassPanel style={[styles.card, styles.mono]}>
          <VoxaText variant="caption" style={styles.monoLabel}>
            Last realtime error
          </VoxaText>
          {lastErr ? (
            <>
              <VoxaText variant="muted">{lastErr.at}</VoxaText>
              <VoxaText variant="body" style={styles.err}>
                {lastErr.message}
              </VoxaText>
            </>
          ) : (
            <VoxaText variant="muted">None recorded this launch.</VoxaText>
          )}
        </GlassPanel>

        <GlassPanel style={styles.card}>
          <Row label="App version" value={String(version)} />
          <Row label="Native build" value={String(build)} />
          <Row label="Bundle ID" value={bundleId} />
        </GlassPanel>

        <VoxaButton title="Refresh" variant="ghost" onPress={() => void refresh()} />
        <VoxaButton title="Done" onPress={() => router.back()} />
      </ScrollView>
    </GradientBackground>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <VoxaText variant="muted" style={styles.rowLabel}>
        {label}
      </VoxaText>
      <VoxaText variant="body" style={styles.rowValue}>
        {value}
      </VoxaText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  over: {
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  card: {
    gap: spacing.sm,
  },
  mono: {
    paddingVertical: spacing.sm,
  },
  monoLabel: {
    marginBottom: spacing.xs,
  },
  err: {
    marginTop: spacing.xs,
  },
  row: {
    gap: 2,
  },
  rowLabel: {
    fontSize: 12,
  },
  rowValue: {
    fontWeight: '600',
  },
});
