import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';

import { VoxaOrb } from '@/components/onboarding/VoxaOrb';
import { BetaDisclaimer } from '@/components/ui/BetaDisclaimer';
import { VoxaButton } from '@/components/ui/VoxaButton';
import { VoxaText } from '@/components/ui/VoxaText';
import { getLessonById } from '@/constants/lessonPaths';
import { gradients, palette, radii, spacing } from '@/constants/theme';

const INSPIRE_PROMPTS: Record<string, string[]> = {
  default: [
    'Hello! Nice to meet you.',
    'Could you help me with this?',
    'I would like to practice speaking more naturally.',
  ],
  es_greetings: ['Hola, ¿cómo estás?', 'Buenos días. Mucho gusto.', 'Hasta luego, gracias.'],
  be_job_interview: [
    'Thank you for meeting with me today.',
    'In my last role, I led a project that improved team communication.',
  ],
};

export default function ImmersivePracticeScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const insets = useSafeAreaInsets();
  const lesson = useMemo(() => (lessonId ? getLessonById(lessonId) : undefined), [lessonId]);

  const [showType, setShowType] = useState(false);
  const [draft, setDraft] = useState('');

  const inspire = useCallback(() => {
    const pool = INSPIRE_PROMPTS[lesson?.id ?? ''] ?? INSPIRE_PROMPTS.default;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setDraft(pick);
    setShowType(true);
  }, [lesson?.id]);

  const onMicPress = useCallback(() => {
    Alert.alert(
      'Live voice practice',
      'Full speech-to-speech practice is coming soon. For now, use Type or start text practice from the lesson screen.',
      [{ text: 'OK' }],
    );
  }, []);

  if (!lesson) {
    return (
      <LinearGradient colors={[...gradients.background]} style={styles.flex}>
        <View style={[styles.center, { paddingTop: insets.top }]}>
          <VoxaText variant="title">Lesson not found</VoxaText>
          <VoxaButton title="Close" onPress={() => router.back()} />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#070A12', '#0B1A3A', '#152E5C']} style={styles.flex}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top}>
        <View style={[styles.container, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.topBar}>
            <Pressable onPress={() => router.back()} hitSlop={16} style={styles.closeBtn}>
              <VoxaText variant="lead">✕</VoxaText>
            </Pressable>
            <VoxaText variant="caption" style={styles.speed}>
              Speed · 1.0×
            </VoxaText>
          </View>

          <View style={styles.centerStage}>
            <VoxaOrb size={120} />
            <VoxaText variant="title" style={styles.lessonTitle}>
              {lesson.title}
            </VoxaText>
            <VoxaText variant="muted" style={styles.sub}>
              Immersive shell · live voice coming soon
            </VoxaText>
          </View>

          {showType ? (
            <View style={styles.typePanel}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Type your response…"
                placeholderTextColor={palette.textMuted}
                style={styles.input}
                multiline
              />
              <VoxaButton title="Hide keyboard" variant="ghost" onPress={() => setShowType(false)} />
            </View>
          ) : null}

          <BetaDisclaimer compact />

          <View style={styles.controls}>
            <CircleAction label="Inspire" icon="✨" onPress={inspire} />
            <Pressable onPress={onMicPress} style={styles.micWrap}>
              <LinearGradient colors={[...gradients.accent]} style={styles.micBtn}>
                <VoxaText variant="hero" style={styles.micIcon}>
                  🎙
                </VoxaText>
              </LinearGradient>
            </Pressable>
            <CircleAction label="Type" icon="⌨️" onPress={() => setShowType((v) => !v)} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function CircleAction({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.sideAction}>
      <View style={styles.sideCircle}>
        <VoxaText variant="lead">{icon}</VoxaText>
      </View>
      <VoxaText variant="caption">{label}</VoxaText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: palette.frost,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speed: {
    opacity: 0.7,
    letterSpacing: 0.6,
  },
  centerStage: {
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
    justifyContent: 'center',
  },
  lessonTitle: {
    textAlign: 'center',
  },
  sub: {
    textAlign: 'center',
    maxWidth: 280,
  },
  typePanel: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  input: {
    minHeight: 88,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.frostStrong,
    padding: spacing.md,
    color: palette.textPrimary,
    backgroundColor: palette.frost,
    textAlignVertical: 'top',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingTop: spacing.md,
  },
  sideAction: {
    alignItems: 'center',
    gap: spacing.xs,
    width: 72,
  },
  sideCircle: {
    width: 52,
    height: 52,
    borderRadius: radii.full,
    backgroundColor: palette.frostStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micWrap: {
    marginBottom: spacing.sm,
  },
  micBtn: {
    width: 80,
    height: 80,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.cyan,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  micIcon: {
    fontSize: 32,
  },
});
