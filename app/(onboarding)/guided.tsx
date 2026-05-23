import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChatBubble } from '@/components/onboarding/ChatBubble';
import { OnboardingProgressBar } from '@/components/onboarding/OnboardingProgressBar';
import { VoxaOrb } from '@/components/onboarding/VoxaOrb';
import { BetaDisclaimer } from '@/components/ui/BetaDisclaimer';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { VoxaButton } from '@/components/ui/VoxaButton';
import { VoxaText } from '@/components/ui/VoxaText';
import {
  EXPLANATION_LANGUAGE_OPTIONS,
  GUIDED_ONBOARDING_STEP_COUNT,
  INTEREST_OPTIONS,
  LEVEL_OPTIONS,
  NATIVE_LANGUAGE_OPTIONS,
  TARGET_LANGUAGE_OPTIONS,
} from '@/constants/onboardingOptions';
import { palette, radii, spacing } from '@/constants/theme';
import { trackEvent } from '@/lib/analytics/track';
import { useAuth } from '@/lib/auth/AuthContext';
import type {
  ExplanationLanguage,
  Interest,
  LearnerLevel,
  LearningLanguage,
  NativeLanguage,
} from '@/lib/learning/types';
import { completeGuidedOnboarding, saveGuidedProfile } from '@/lib/onboarding/guidedProfile';
import { setPreferredLanguage } from '@/lib/preferences/storage';

type StepId =
  | 'name'
  | 'native_language'
  | 'target_language'
  | 'interests'
  | 'level'
  | 'explanation_language'
  | 'completion';

const STEPS: StepId[] = [
  'name',
  'native_language',
  'target_language',
  'interests',
  'level',
  'explanation_language',
  'completion',
];

export default function GuidedOnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [stepIndex, setStepIndex] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [nativeLanguage, setNativeLanguage] = useState<NativeLanguage | null>(null);
  const [targetLanguage, setTargetLanguage] = useState<LearningLanguage | null>(null);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [level, setLevel] = useState<LearnerLevel | null>(null);
  const [explanationLanguage, setExplanationLanguage] = useState<ExplanationLanguage | null>(null);
  const [busy, setBusy] = useState(false);

  const step = STEPS[stepIndex];

  const assistantPrompt = useMemo(() => {
    switch (step) {
      case 'name':
        return 'Welcome to Voxa. I’m your AI language coach — calm, focused, and here for real practice. What should I call you?';
      case 'native_language':
        return displayName
          ? `Great to meet you, ${displayName}. What language do you speak most comfortably?`
          : 'What language do you speak most comfortably?';
      case 'target_language':
        return 'Which language would you like to practice with Voxa?';
      case 'interests':
        return 'What topics matter most to you? Pick a few — we’ll shape lessons around them.';
      case 'level':
        return 'Where would you place yourself today? No pressure — we’ll meet you there.';
      case 'explanation_language':
        return 'When I explain corrections, which language should I use?';
      case 'completion':
        return 'You’re set. Your lesson map is ready — first lesson unlocked. Voice playback is manual; tap “Hear this” when you want audio.';
      default:
        return '';
    }
  }, [step, displayName]);

  const canContinue = useMemo(() => {
    switch (step) {
      case 'name':
        return displayName.trim().length >= 1;
      case 'native_language':
        return nativeLanguage !== null;
      case 'target_language':
        return targetLanguage !== null;
      case 'interests':
        return interests.length >= 1;
      case 'level':
        return level !== null;
      case 'explanation_language':
        return explanationLanguage !== null;
      case 'completion':
        return true;
      default:
        return false;
    }
  }, [step, displayName, nativeLanguage, targetLanguage, interests, level, explanationLanguage]);

  const toggleInterest = useCallback((id: Interest) => {
    setInterests((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const goNext = useCallback(async () => {
    if (!canContinue || busy) return;

    if (stepIndex < STEPS.length - 1) {
      setStepIndex((i) => i + 1);
      return;
    }

    setBusy(true);
    try {
      const profile = {
        displayName: displayName.trim(),
        nativeLanguage,
        targetLanguage,
        interests,
        level,
        explanationLanguage,
        onboardingCompleted: true,
      };

      if (targetLanguage) {
        await setPreferredLanguage(targetLanguage);
      }

      await completeGuidedOnboarding(profile, user?.id);
      trackEvent('guided_onboarding_completed', {
        target_language: targetLanguage,
        level,
      });

      router.replace('/(app)/lesson-map');
    } finally {
      setBusy(false);
    }
  }, [
    busy,
    canContinue,
    displayName,
    explanationLanguage,
    interests,
    level,
    nativeLanguage,
    stepIndex,
    targetLanguage,
    user?.id,
  ]);

  const persistPartial = useCallback(async () => {
    await saveGuidedProfile(
      {
        displayName: displayName.trim(),
        nativeLanguage,
        targetLanguage,
        interests,
        level,
        explanationLanguage,
      },
      user?.id,
    );
  }, [displayName, explanationLanguage, interests, level, nativeLanguage, targetLanguage, user?.id]);

  const renderChoices = () => {
    switch (step) {
      case 'name':
        return (
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
            placeholderTextColor={palette.textMuted}
            style={styles.input}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={() => void goNext()}
          />
        );
      case 'native_language':
        return NATIVE_LANGUAGE_OPTIONS.map((opt) => (
          <ChoiceCard
            key={opt.id}
            label={opt.label}
            active={nativeLanguage === opt.id}
            onPress={() => {
              setNativeLanguage(opt.id);
            }}
          />
        ));
      case 'target_language':
        return TARGET_LANGUAGE_OPTIONS.map((opt) => (
          <ChoiceCard
            key={opt.id}
            label={opt.label}
            hint={opt.hint}
            active={targetLanguage === opt.id}
            onPress={() => {
              setTargetLanguage(opt.id);
            }}
          />
        ));
      case 'interests':
        return (
          <View style={styles.chipGrid}>
            {INTEREST_OPTIONS.map((opt) => (
              <Pressable
                key={opt.id}
                onPress={() => toggleInterest(opt.id)}
                style={[styles.chip, interests.includes(opt.id) && styles.chipActive]}>
                <VoxaText variant="body">
                  {opt.emoji} {opt.label}
                </VoxaText>
              </Pressable>
            ))}
          </View>
        );
      case 'level':
        return LEVEL_OPTIONS.map((opt) => (
          <ChoiceCard
            key={opt.id}
            label={opt.label}
            hint={opt.hint}
            active={level === opt.id}
            onPress={() => setLevel(opt.id)}
          />
        ));
      case 'explanation_language':
        return EXPLANATION_LANGUAGE_OPTIONS.map((opt) => (
          <ChoiceCard
            key={opt.id}
            label={opt.label}
            hint={opt.hint}
            active={explanationLanguage === opt.id}
            onPress={() => setExplanationLanguage(opt.id)}
          />
        ));
      case 'completion':
        return (
          <GlassPanel style={styles.summaryCard}>
            <SummaryRow label="Name" value={displayName.trim()} />
            <SummaryRow
              label="Learning"
              value={TARGET_LANGUAGE_OPTIONS.find((o) => o.id === targetLanguage)?.label ?? '—'}
            />
            <SummaryRow label="Level" value={LEVEL_OPTIONS.find((o) => o.id === level)?.label ?? '—'} />
            <VoxaText variant="muted" style={styles.voiceNote}>
              Voice playback is manual — tap “Hear this” when you want audio.
            </VoxaText>
          </GlassPanel>
        );
      default:
        return null;
    }
  };

  const userReply = useMemo(() => {
    switch (step) {
      case 'name':
        return displayName.trim() || null;
      case 'native_language':
        return NATIVE_LANGUAGE_OPTIONS.find((o) => o.id === nativeLanguage)?.label ?? null;
      case 'target_language':
        return TARGET_LANGUAGE_OPTIONS.find((o) => o.id === targetLanguage)?.label ?? null;
      case 'interests':
        return interests.length
          ? interests
              .map((id) => INTEREST_OPTIONS.find((o) => o.id === id)?.label)
              .filter(Boolean)
              .join(', ')
          : null;
      case 'level':
        return LEVEL_OPTIONS.find((o) => o.id === level)?.label ?? null;
      case 'explanation_language':
        return EXPLANATION_LANGUAGE_OPTIONS.find((o) => o.id === explanationLanguage)?.label ?? null;
      default:
        return null;
    }
  }, [step, displayName, nativeLanguage, targetLanguage, interests, level, explanationLanguage]);

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xl },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <OnboardingProgressBar step={stepIndex + 1} total={GUIDED_ONBOARDING_STEP_COUNT} />

          <View style={styles.headerRow}>
            <VoxaOrb size={48} />
            <VoxaText variant="caption" style={styles.overline}>
              Voxa coach · Step {stepIndex + 1} of {GUIDED_ONBOARDING_STEP_COUNT}
            </VoxaText>
          </View>

          <ChatBubble role="assistant">{assistantPrompt}</ChatBubble>
          {userReply && step !== 'completion' ? <ChatBubble role="user">{userReply}</ChatBubble> : null}

          <View style={styles.choices}>{renderChoices()}</View>

          <BetaDisclaimer compact />

          <VoxaButton
            title={step === 'completion' ? 'Open lesson map' : 'Continue'}
            disabled={!canContinue || busy}
            onPress={() => {
              void persistPartial();
              void goNext();
            }}
            containerStyle={styles.cta}
          />

          {stepIndex > 0 && step !== 'completion' ? (
            <Pressable onPress={() => setStepIndex((i) => Math.max(0, i - 1))} style={styles.back}>
              <VoxaText variant="caption" style={styles.backText}>
                Back
              </VoxaText>
            </Pressable>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

function ChoiceCard({
  label,
  hint,
  active,
  onPress,
}: {
  label: string;
  hint?: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.choiceWrap}>
      <GlassPanel style={[styles.choiceCard, active && styles.choiceActive]}>
        <VoxaText variant="lead">{label}</VoxaText>
        {hint ? <VoxaText variant="muted">{hint}</VoxaText> : null}
      </GlassPanel>
    </Pressable>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <VoxaText variant="caption" style={styles.summaryLabel}>
        {label}
      </VoxaText>
      <VoxaText variant="body">{value}</VoxaText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  overline: {
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    flex: 1,
  },
  choices: {
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.frostStrong,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: palette.textPrimary,
    fontSize: 17,
    backgroundColor: palette.frost,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.frostStrong,
    backgroundColor: palette.frost,
  },
  chipActive: {
    borderColor: palette.cyan,
    backgroundColor: 'rgba(56, 217, 255, 0.12)',
  },
  summaryCard: {
    gap: spacing.sm,
  },
  summaryRow: {
    gap: 2,
  },
  summaryLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    opacity: 0.75,
  },
  voiceNote: {
    marginTop: spacing.xs,
  },
  cta: {
    marginTop: spacing.sm,
  },
  back: {
    alignSelf: 'center',
    padding: spacing.sm,
  },
  backText: {
    color: palette.cyan,
  },
  choiceWrap: {
    borderRadius: radii.lg,
  },
  choiceCard: {
    borderRadius: radii.lg,
    gap: spacing.xs,
  },
  choiceActive: {
    borderColor: palette.electricBlue,
    borderWidth: 1,
  },
});
