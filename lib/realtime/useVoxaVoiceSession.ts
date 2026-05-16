import { setAudioModeAsync } from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { trackEvent } from '@/lib/analytics/track';
import { recordRealtimeError } from '@/lib/diagnostics/realtimeErrors';
import { extractCorrectionSnippet } from '@/lib/realtime/correctionHints';
import { getAudioStreamModule } from '@/lib/realtime/audioStreamModule';
import type { ApiLearningPath } from '@/lib/realtime/learningPath';
import { fetchRealtimeClientSecret } from '@/lib/realtime/session';
import type { UserLevel } from '@/lib/realtime/types';
import { RealtimeConfigurationError } from '@/lib/realtime/types';
import type { TranscriptMessage, TranscriptPersistPayload, VoiceSessionPhase } from '@/lib/realtime/voiceSessionTypes';

/** ~10ms silence @ 24kHz mono PCM16 — terminal chunk for Pipeline drain */
function silencePcmBase64(samples = 240): string {
  const bytes = samples * 2;
  const u8 = new Uint8Array(bytes);
  let binary = '';
  for (let i = 0; i < bytes; i++) {
    binary += String.fromCharCode(u8[i]!);
  }
  return btoa(binary);
}

const SILENCE_TAIL_B64 = silencePcmBase64(240);
const REALTIME_WS = 'wss://api.openai.com/v1/realtime';

export type UseVoxaVoiceSessionParams = {
  scenarioId: string;
  scenarioTitle: string;
  learningPath: ApiLearningPath;
  userLevel: UserLevel;
  authToken: string;
  /** Optional: debounce / persist in the caller (e.g. Supabase). */
  onTranscriptPersist?: (payload: TranscriptPersistPayload) => void;
  onCorrectionPersist?: (snippet: string) => void;
};

export function useVoxaVoiceSession(params: UseVoxaVoiceSessionParams) {
  const onTranscriptPersistRef = useRef(params.onTranscriptPersist);
  const onCorrectionPersistRef = useRef(params.onCorrectionPersist);
  useEffect(() => {
    onTranscriptPersistRef.current = params.onTranscriptPersist;
    onCorrectionPersistRef.current = params.onCorrectionPersist;
  }, [params.onCorrectionPersist, params.onTranscriptPersist]);

  const [phase, setPhase] = useState<VoiceSessionPhase>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [corrections, setCorrections] = useState<string[]>([]);
  const [sessionSummary, setSessionSummary] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const micSubRef = useRef<{ remove: () => void } | null>(null);
  const pipelineErrSubRef = useRef<{ remove: () => void } | null>(null);
  const mutedRef = useRef(false);
  const intentionalEndRef = useRef(false);
  const activeResponseIdRef = useRef<string | null>(null);
  const isFirstAudioChunkRef = useRef(true);
  const bargeSeqRef = useRef(0);
  const assistantItemRef = useRef<string | null>(null);
  const connectedAtRef = useRef<number | null>(null);

  mutedRef.current = muted;

  const upsertTranscript = useCallback((id: string, role: 'user' | 'assistant', delta: string) => {
    if (!delta) return;
    setMessages((prev) => {
      const i = prev.findIndex((m) => m.id === id);
      const nextText = i === -1 ? delta : prev[i]!.text + delta;
      if (i === -1) {
        queueMicrotask(() =>
          onTranscriptPersistRef.current?.({
            clientMessageId: id,
            role,
            text: nextText,
            partial: true,
          }),
        );
        return [...prev, { id, role, text: delta, partial: true }];
      }
      const next = [...prev];
      const cur = next[i]!;
      next[i] = { ...cur, text: cur.text + delta, partial: true };
      queueMicrotask(() =>
        onTranscriptPersistRef.current?.({
          clientMessageId: id,
          role,
          text: nextText,
          partial: true,
        }),
      );
      return next;
    });
  }, []);

  const finalizeTranscript = useCallback((id: string) => {
    setMessages((prev) => {
      const i = prev.findIndex((m) => m.id === id);
      if (i === -1) return prev;
      const next = [...prev];
      next[i] = { ...next[i]!, partial: false };
      const row = next[i]!;
      queueMicrotask(() =>
        onTranscriptPersistRef.current?.({
          clientMessageId: id,
          role: row.role,
          text: row.text,
          partial: false,
        }),
      );
      return next;
    });
  }, []);

  const cleanupTransport = useCallback(async () => {
    const audio = getAudioStreamModule();
    try {
      micSubRef.current?.remove();
      micSubRef.current = null;
    } catch {
      /* noop */
    }
    try {
      await audio?.ExpoPlayAudioStream.stopMicrophone();
    } catch {
      /* noop */
    }
    try {
      pipelineErrSubRef.current?.remove();
      pipelineErrSubRef.current = null;
    } catch {
      /* noop */
    }
    try {
      await audio?.Pipeline.disconnect();
    } catch {
      /* noop */
    }
    try {
      wsRef.current?.close();
    } catch {
      /* noop */
    }
    wsRef.current = null;
    activeResponseIdRef.current = null;
    isFirstAudioChunkRef.current = true;
    assistantItemRef.current = null;
  }, []);

  const handleServerEvent = useCallback(
    (raw: Record<string, unknown>) => {
      const type = raw.type as string;

      if (type === 'error') {
        const err = raw.error as { message?: string } | undefined;
        const msg = err?.message ?? 'Realtime error';
        recordRealtimeError(msg);
        trackEvent('voice_session_failed', {
          message: msg,
          reason: 'realtime_server',
          scenario_id: params.scenarioId,
        });
        setErrorMessage(msg);
        setPhase('error');
        return;
      }

      if (type === 'input_audio_buffer.speech_started') {
        bargeSeqRef.current += 1;
        const { Pipeline: P } = getAudioStreamModule() ?? {};
        void P?.invalidateTurn({ turnId: `barge-${bargeSeqRef.current}` });
        setPhase('listening');
        return;
      }

      if (type === 'input_audio_buffer.speech_stopped') {
        setPhase((p) => (p === 'listening' ? 'connected' : p));
        return;
      }

      if (type === 'response.created') {
        const res = raw.response as { id?: string } | undefined;
        const rid = res?.id ?? (typeof raw.response_id === 'string' ? raw.response_id : undefined);
        activeResponseIdRef.current = rid ?? `resp-${Date.now()}`;
        isFirstAudioChunkRef.current = true;
        return;
      }

      if (type === 'response.output_audio.delta') {
        const delta = raw.delta as string | undefined;
        const rid = activeResponseIdRef.current;
        const { Pipeline: P } = getAudioStreamModule() ?? {};
        if (delta && rid && P) {
          P.pushAudioSync({
            audio: delta,
            turnId: rid,
            isFirstChunk: isFirstAudioChunkRef.current,
            isLastChunk: false,
          });
          isFirstAudioChunkRef.current = false;
        }
        setPhase('ai_speaking');
        return;
      }

      if (type === 'response.output_audio.done') {
        const rid = activeResponseIdRef.current;
        const { Pipeline: P } = getAudioStreamModule() ?? {};
        if (rid && P) {
          P.pushAudioSync({
            audio: SILENCE_TAIL_B64,
            turnId: rid,
            isFirstChunk: false,
            isLastChunk: true,
          });
        }
        return;
      }

      if (type === 'response.output_audio_transcript.delta') {
        const delta = typeof raw.delta === 'string' ? raw.delta : '';
        const itemId =
          typeof raw.item_id === 'string' ? raw.item_id : assistantItemRef.current ?? 'assistant-pending';
        assistantItemRef.current = itemId;
        upsertTranscript(itemId, 'assistant', delta);
        return;
      }

      if (type === 'response.output_audio_transcript.done') {
        const itemId = typeof raw.item_id === 'string' ? raw.item_id : assistantItemRef.current;
        const transcript = typeof raw.transcript === 'string' ? raw.transcript : '';
        if (itemId) {
          if (transcript) {
            setMessages((prev) => {
              const i = prev.findIndex((m) => m.id === itemId);
              if (i === -1) {
                return [...prev, { id: itemId, role: 'assistant' as const, text: transcript, partial: false }];
              }
              const next = [...prev];
              next[i] = { ...next[i]!, text: transcript, partial: false };
              return next;
            });
            const hint = extractCorrectionSnippet(transcript);
            if (hint) {
              setCorrections((c) => (c.includes(hint) ? c : [...c, hint].slice(-8)));
              queueMicrotask(() => onCorrectionPersistRef.current?.(hint));
            }
            queueMicrotask(() =>
              onTranscriptPersistRef.current?.({
                clientMessageId: itemId,
                role: 'assistant',
                text: transcript,
                partial: false,
              }),
            );
          } else {
            finalizeTranscript(itemId);
          }
        }
        return;
      }

      if (type === 'conversation.item.input_audio_transcription.delta') {
        const delta = typeof raw.delta === 'string' ? raw.delta : '';
        const itemId = typeof raw.item_id === 'string' ? raw.item_id : 'user-pending';
        upsertTranscript(itemId, 'user', delta);
        return;
      }

      if (type === 'conversation.item.input_audio_transcription.completed') {
        const itemId = typeof raw.item_id === 'string' ? raw.item_id : null;
        if (itemId) finalizeTranscript(itemId);
        return;
      }

      if (type === 'response.done') {
        setPhase((p) => (p === 'ai_speaking' || p === 'listening' ? 'connected' : p));
      }
    },
    [finalizeTranscript, params.scenarioId, upsertTranscript],
  );

  const startSession = useCallback(async () => {
    setMuted(false);
    mutedRef.current = false;
    try {
      getAudioStreamModule()?.ExpoPlayAudioStream.toggleSilence(false);
    } catch {
      /* noop */
    }

    setErrorMessage(null);
    setSessionSummary(null);
    setCorrections([]);
    setMessages([]);
    intentionalEndRef.current = false;
    connectedAtRef.current = null;

    if (Platform.OS === 'web') {
      const msg = 'Voice sessions require iOS or Android (native audio).';
      recordRealtimeError(msg);
      trackEvent('voice_session_failed', { message: msg, reason: 'unsupported_platform', scenario_id: params.scenarioId });
      setErrorMessage(msg);
      setPhase('error');
      return;
    }

    const audio = getAudioStreamModule();
    if (!audio) {
      const msg =
        'Voice needs a development build with native audio (Expo Go does not include it). Run: npx expo run:ios or build with EAS.';
      recordRealtimeError(msg);
      trackEvent('voice_session_failed', {
        message: msg,
        reason: 'expo_go_audio_module',
        scenario_id: params.scenarioId,
      });
      setErrorMessage(msg);
      setPhase('error');
      return;
    }

    const { ExpoPlayAudioStream, Pipeline } = audio;

    setPhase('requesting_permission');
    const perm = await ExpoPlayAudioStream.getPermissionsAsync();
    const granted = perm.granted
      ? true
      : (await ExpoPlayAudioStream.requestPermissionsAsync()).granted;
    if (!granted) {
      const msg = 'Microphone permission is required to practice speaking.';
      recordRealtimeError(msg);
      trackEvent('voice_session_failed', { message: msg, reason: 'microphone_denied', scenario_id: params.scenarioId });
      setErrorMessage(msg);
      setPhase('error');
      return;
    }

    setPhase('minting_session');
    let clientSecret: string;
    let model: string;
    try {
      const minted = await fetchRealtimeClientSecret({
        scenarioId: params.scenarioId,
        learningPath: params.learningPath,
        userLevel: params.userLevel,
        authToken: params.authToken,
      });
      clientSecret = minted.clientSecret;
      model = minted.model;
    } catch (e) {
      const msg =
        e instanceof RealtimeConfigurationError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Could not start session';
      recordRealtimeError(msg);
      trackEvent('voice_session_failed', { message: msg, reason: 'mint_session', scenario_id: params.scenarioId });
      setErrorMessage(msg);
      setPhase('error');
      return;
    }

    setPhase('connecting');

    await setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
      interruptionMode: 'duckOthers',
    });

    const url = `${REALTIME_WS}?model=${encodeURIComponent(model)}`;
    const ws = new WebSocket(url, ['realtime', `openai-insecure-api-key.${clientSecret}`]);
    wsRef.current = ws;

    ws.onmessage = (ev) => {
      try {
        const raw = JSON.parse(ev.data as string) as Record<string, unknown>;
        handleServerEvent(raw);
      } catch {
        /* ignore */
      }
    };

    ws.onclose = () => {
      if (intentionalEndRef.current) return;
      const msg = 'Connection closed.';
      recordRealtimeError(msg);
      trackEvent('voice_session_failed', { message: msg, reason: 'websocket_closed', scenario_id: params.scenarioId });
      setPhase((p) =>
        p === 'connecting' || p === 'connected' || p === 'listening' || p === 'ai_speaking' ? 'error' : p,
      );
      setErrorMessage((m) => m ?? msg);
    };

    try {
      await new Promise<void>((resolve, reject) => {
        const t = setTimeout(() => reject(new Error('Connection timeout')), 25_000);

        const finish = () => clearTimeout(t);

        if (ws.readyState === WebSocket.OPEN) {
          finish();
          resolve();
          return;
        }

        const onOpen = () => {
          finish();
          ws.removeEventListener?.('open', onOpen as EventListener);
          ws.removeEventListener?.('error', onErr as EventListener);
          resolve();
        };
        const onErr = () => {
          finish();
          ws.removeEventListener?.('open', onOpen as EventListener);
          ws.removeEventListener?.('error', onErr as EventListener);
          reject(new Error('WebSocket error'));
        };

        if (typeof ws.addEventListener === 'function') {
          ws.addEventListener('open', onOpen as EventListener);
          ws.addEventListener('error', onErr as EventListener);
        } else {
          ws.onopen = onOpen;
          ws.onerror = onErr;
        }
      });
    } catch {
      const msg = 'Could not connect to voice service.';
      recordRealtimeError(msg);
      trackEvent('voice_session_failed', { message: msg, reason: 'websocket_open', scenario_id: params.scenarioId });
      setErrorMessage(msg);
      setPhase('error');
      await cleanupTransport();
      return;
    }

    pipelineErrSubRef.current = Pipeline.onError((err) => {
      recordRealtimeError(err.message);
      trackEvent('voice_session_failed', {
        message: err.message,
        reason: 'playback_pipeline',
        scenario_id: params.scenarioId,
      });
      setErrorMessage(err.message);
      setPhase('error');
    });

    try {
      await Pipeline.connect({
        sampleRate: 24000,
        channelCount: 1,
        playbackMode: 'conversation',
        audioMode: 'duckOthers',
        targetBufferMs: 100,
      });
    } catch {
      const msg = 'Audio output pipeline failed to start.';
      recordRealtimeError(msg);
      trackEvent('voice_session_failed', { message: msg, reason: 'pipeline_connect', scenario_id: params.scenarioId });
      setErrorMessage(msg);
      setPhase('error');
      await cleanupTransport();
      return;
    }

    try {
      const { subscription } = await ExpoPlayAudioStream.startMicrophone({
        sampleRate: 24000,
        channels: 1,
        encoding: 'pcm_16bit',
        interval: 80,
        onAudioStream: async (event) => {
          if (mutedRef.current) return;
          const s = wsRef.current;
          if (!s || s.readyState !== WebSocket.OPEN) return;
          s.send(
            JSON.stringify({
              type: 'input_audio_buffer.append',
              audio: event.data,
            }),
          );
        },
      });
      micSubRef.current = subscription ?? null;
    } catch {
      const msg = 'Microphone streaming failed to start.';
      recordRealtimeError(msg);
      trackEvent('voice_session_failed', { message: msg, reason: 'microphone_stream', scenario_id: params.scenarioId });
      setErrorMessage(msg);
      setPhase('error');
      await cleanupTransport();
      return;
    }

    connectedAtRef.current = Date.now();
    trackEvent('voice_session_started', { scenario_id: params.scenarioId });
    setPhase('connected');
  }, [cleanupTransport, handleServerEvent, params]);

  const endSession = useCallback(async () => {
    intentionalEndRef.current = true;
    setPhase('ended');
    const summary = `You completed a voice session in “${params.scenarioTitle}”. Steady reps build calm, confident speaking.`;
    setSessionSummary(summary);
    const started = connectedAtRef.current;
    const durationSeconds = started ? Math.max(0, Math.round((Date.now() - started) / 1000)) : 0;
    connectedAtRef.current = null;
    await cleanupTransport();
    return { summary, durationSeconds };
  }, [cleanupTransport, params.scenarioTitle]);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      try {
        getAudioStreamModule()?.ExpoPlayAudioStream.toggleSilence(next);
      } catch {
        /* noop */
      }
      mutedRef.current = next;
      return next;
    });
  }, []);

  useEffect(() => {
    return () => {
      intentionalEndRef.current = true;
      void cleanupTransport();
    };
  }, [cleanupTransport]);

  return {
    phase,
    errorMessage,
    messages,
    corrections,
    sessionSummary,
    muted,
    startSession,
    endSession,
    toggleMute,
  };
}
