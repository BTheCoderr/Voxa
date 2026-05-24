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
import { fetchCoachHealth } from '@/lib/ai/coachHealth';
import { isVoicePracticeMode } from '@/lib/ai/mode';
import { useAuth } from '@/lib/auth/AuthContext';
import { getLastRealtimeError } from '@/lib/diagnostics/realtimeErrors';
import { env } from '@/lib/env';
import { canAccessScreenshotPreview } from '@/lib/presentation/screenshotMode';
import { getAudioStreamModule } from '@/lib/realtime/audioStreamModule';
import {
  fetchTtsTestAudio,
  fetchTtsHealth,
  getTtsUserErrorMessage,
  playBase64Audio,
} from '@/lib/tts/elevenLabsTts';

function boolLabel(v: boolean): string {
  return v ? 'Yes' : 'No';
}

export default function DebugHealthScreen() {
  const insets = useSafeAreaInsets();
  const { user, initialized, session } = useAuth();
  const [micStatus, setMicStatus] = useState<string>('…');
  const [lastErr, setLastErr] = useState<ReturnType<typeof getLastRealtimeError>>(null);
  const [coachHealth, setCoachHealth] = useState<string>('…');
  const [ttsHealth, setTtsHealth] = useState<string>('…');
  const [ttsTestStatus, setTtsTestStatus] = useState<string | null>(null);
  const [ttsTesting, setTtsTesting] = useState(false);

  const refresh = useCallback(async () => {
    setLastErr(getLastRealtimeError());

    if (env.aiChatCoachConfigured) {
      const health = await fetchCoachHealth(session?.access_token);
      if (!health) {
        setCoachHealth('Server-side · could not reach health endpoint');
      } else {
        const parts = [
          'Server-side',
          `primary: ${health.primaryProvider}`,
          `fallback: ${health.fallbackAvailable ? health.fallbackProvider : 'none'}`,
          `groq: ${health.providers.groq}`,
          `gemini: ${health.providers.gemini}`,
        ];
        setCoachHealth(parts.join(' · '));
      }
    } else {
      setCoachHealth('Not configured');
    }

    if (env.elevenLabsTtsConfigured) {
      const health = await fetchTtsHealth(session?.access_token);
      if (!health) {
        setTtsHealth('Could not reach TTS health endpoint');
      } else {
        const parts = [
          `hasKey: ${health.hasKey}`,
          health.keyPrefix ? `prefix: ${health.keyPrefix}` : null,
          health.defaultModel ? `model: ${health.defaultModel}` : null,
        ].filter(Boolean);
        setTtsHealth(parts.join(' · '));
      }
    } else {
      setTtsHealth('URL not configured');
    }
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
  }, [session?.access_token]);

  const runVoiceTest = useCallback(async () => {
    if (ttsTesting) return;
    setTtsTestStatus(null);
    setTtsTesting(true);
    try {
      if (!user || !session?.access_token) {
        setTtsTestStatus('Sign in to test voice playback.');
        return;
      }
      if (!env.elevenLabsTtsConfigured) {
        setTtsTestStatus('Voice playback is not set up yet.');
        return;
      }
      const audio = await fetchTtsTestAudio(session?.access_token);
      await playBase64Audio(audio.audioBase64, audio.contentType);
      setTtsTestStatus('Voice test played successfully.');
    } catch (e) {
      setTtsTestStatus(getTtsUserErrorMessage(e));
    } finally {
      setTtsTesting(false);
    }
  }, [session?.access_token, ttsTesting, user]);

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
          <Row label="AI mode" value={isVoicePracticeMode() ? 'voice (premium)' : 'text (default)'} />
          <Row label="AI chat coach URL" value={boolLabel(env.aiChatCoachConfigured)} />
          <Row label="ElevenLabs TTS URL" value={boolLabel(env.elevenLabsTtsConfigured)} />
          <Row label="TTS health" value={ttsHealth} />
          <Row label="AI provider keys" value="Server-side only" />
          <Row label="Coach health" value={coachHealth} />
          <Row label="Realtime session URL" value={boolLabel(env.realtimeSessionConfigured)} />
          <Row label="PostHog key" value={boolLabel(Boolean(env.posthogKey))} />
        </GlassPanel>

        <GlassPanel style={styles.card}>
          <VoxaText variant="caption" style={styles.monoLabel}>
            Voice playback test
          </VoxaText>
          <VoxaText variant="muted">
            Calls elevenlabs-tts with a short test sentence. Does not affect text practice.
          </VoxaText>
          <VoxaButton
            title={ttsTesting ? 'Testing voice…' : 'Test Voxa voice'}
            onPress={() => void runVoiceTest()}
            disabled={ttsTesting || !user}
          />
          {!user ? (
            <VoxaText variant="muted">Sign in to run the voice playback test.</VoxaText>
          ) : null}
          {ttsTestStatus ? (
            <VoxaText variant="body" style={styles.err}>
              {ttsTestStatus}
            </VoxaText>
          ) : null}
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
        {canAccessScreenshotPreview() ? (
          <VoxaButton
            title="Screenshot preview"
            variant="ghost"
            onPress={() => router.push('/(app)/screenshot-preview')}
          />
        ) : null}
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
