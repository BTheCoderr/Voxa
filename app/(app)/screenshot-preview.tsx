import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TextCorrectionCards } from '@/components/conversation/TextCorrectionCards';
import { TextMessageList, type TextChatMessage } from '@/components/conversation/TextMessageList';
import { LessonNodeCard } from '@/components/lessons/LessonNodeCard';
import { TabletContent } from '@/components/layout/TabletContent';
import { VoiceWaveDecoration } from '@/components/marketing/VoiceWaveDecoration';
import { ChatBubble } from '@/components/onboarding/ChatBubble';
import { OnboardingProgressBar } from '@/components/onboarding/OnboardingProgressBar';
import { VoxaOrb } from '@/components/onboarding/VoxaOrb';
import { BetaDisclaimer } from '@/components/ui/BetaDisclaimer';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { VoxaButton } from '@/components/ui/VoxaButton';
import { VoxaText } from '@/components/ui/VoxaText';
import { getLessonsForPath } from '@/constants/lessonPaths';
import { TARGET_LANGUAGE_OPTIONS } from '@/constants/onboardingOptions';
import { palette, radii, spacing } from '@/constants/theme';
import type { ChatCoachCorrection } from '@/lib/ai/providers/types';
import { canAccessScreenshotPreview } from '@/lib/presentation/screenshotMode';

const MOCK_MESSAGES: TextChatMessage[] = [
  { id: '1', role: 'assistant', text: 'Hi — let’s practice a warm introduction. How would you greet someone at a networking event?' },
  { id: '2', role: 'user', text: 'Hello, nice to meet you. I work in product design.' },
  { id: '3', role: 'assistant', text: 'That’s a clear opener. Try adding one detail about what you’re hoping to learn from the conversation.' },
];

const MOCK_CORRECTIONS: ChatCoachCorrection[] = [
  {
    original: 'I am work in product design',
    improved: 'I work in product design',
    explanation: 'Use simple present for your role — no “am” before “work”.',
  },
];

const FRAMES = [
  'welcome',
  'guided_language',
  'lesson_map',
  'text_practice',
  'voice_playback',
  'progress',
] as const;

type FrameId = (typeof FRAMES)[number];

const FRAME_LABELS: Record<FrameId, string> = {
  welcome: 'Welcome',
  guided_language: 'Guided · Language',
  lesson_map: 'Lesson map',
  text_practice: 'Text practice',
  voice_playback: 'Hear this response',
  progress: 'Progress',
};

export default function ScreenshotPreviewScreen() {
  const insets = useSafeAreaInsets();
  const [frame, setFrame] = useState<FrameId>('welcome');

  if (!canAccessScreenshotPreview()) {
    return <Redirect href="/" />;
  }

  const spanishLessons = getLessonsForPath('spanish', 'beginner').slice(0, 3);

  return (
    <GradientBackground>
      <View style={[styles.shell, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom }]}>
        <VoxaText variant="caption" style={styles.banner}>
          Screenshot preview · not shown to users
        </VoxaText>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {FRAMES.map((id) => (
            <Pressable
              key={id}
              onPress={() => setFrame(id)}
              style={[styles.tab, frame === id && styles.tabActive]}>
              <VoxaText variant="caption" style={frame === id ? styles.tabTextActive : styles.tabText}>
                {FRAME_LABELS[id]}
              </VoxaText>
            </Pressable>
          ))}
        </ScrollView>

        <ScrollView
          contentContainerStyle={styles.frameScroll}
          showsVerticalScrollIndicator={false}
          key={frame}>
          <TabletContent fullWidth style={styles.frame}>
            {frame === 'welcome' ? <WelcomeFrame /> : null}
            {frame === 'guided_language' ? <GuidedLanguageFrame /> : null}
            {frame === 'lesson_map' ? (
              <LessonMapFrame lessons={spanishLessons} completedIds={[spanishLessons[0]?.id ?? '']} />
            ) : null}
            {frame === 'text_practice' ? <TextPracticeFrame messages={MOCK_MESSAGES} corrections={MOCK_CORRECTIONS} /> : null}
            {frame === 'voice_playback' ? <VoicePlaybackFrame /> : null}
            {frame === 'progress' ? <ProgressFrame /> : null}
          </TabletContent>
        </ScrollView>
      </View>
    </GradientBackground>
  );
}

function WelcomeFrame() {
  return (
    <View style={styles.frameInner}>
      <VoxaOrb size={72} />
      <VoiceWaveDecoration compact />
      <VoxaText variant="hero">Speak naturally with AI.</VoxaText>
      <VoxaText variant="lead">
        Practice real conversations in Business English, Spanish, and Mandarin.
      </VoxaText>
      <BetaDisclaimer compact />
      <VoxaButton title="Start practicing" containerStyle={styles.frameGap} />
      <VoxaButton title="I already have an account" variant="ghost" />
    </View>
  );
}

function GuidedLanguageFrame() {
  return (
    <View style={styles.frameInner}>
      <OnboardingProgressBar step={3} total={7} />
      <View style={styles.coachRow}>
        <VoxaOrb size={44} />
        <VoxaText variant="caption" style={styles.coachLabel}>
          Voxa coach · Step 3 of 7
        </VoxaText>
      </View>
      <ChatBubble role="assistant">Which language would you like to practice with Voxa?</ChatBubble>
      <ChatBubble role="user">Spanish</ChatBubble>
      {TARGET_LANGUAGE_OPTIONS.map((opt) => (
        <GlassPanel
          key={opt.id}
          style={[styles.choiceCard, opt.id === 'spanish' && styles.choiceActive]}>
          <VoxaText variant="lead">{opt.label}</VoxaText>
          <VoxaText variant="muted">{opt.hint}</VoxaText>
        </GlassPanel>
      ))}
      <VoxaButton title="Continue" containerStyle={styles.frameGap} />
    </View>
  );
}

function LessonMapFrame({
  lessons,
  completedIds,
}: {
  lessons: ReturnType<typeof getLessonsForPath>;
  completedIds: string[];
}) {
  return (
    <View style={styles.frameInner}>
      <VoxaText variant="caption" style={styles.overline}>
        Guided lessons
      </VoxaText>
      <VoxaText variant="title">Spanish</VoxaText>
      <VoxaText variant="body">Beginner path · 5 lessons</VoxaText>
      <BetaDisclaimer compact />
      {lessons.map((lesson, index) => (
        <View key={lesson.id}>
          {index > 0 ? <View style={styles.connector} /> : null}
          <LessonNodeCard
            lesson={lesson}
            locked={index > 1}
            completed={completedIds.includes(lesson.id)}
            onPress={() => {}}
          />
        </View>
      ))}
    </View>
  );
}

function TextPracticeFrame({
  messages,
  corrections,
}: {
  messages: TextChatMessage[];
  corrections: ChatCoachCorrection[];
}) {
  return (
    <View style={styles.frameInner}>
      <VoxaText variant="caption" style={styles.overline}>
        Text Practice · Spanish
      </VoxaText>
      <VoxaText variant="title">Networking</VoxaText>
      <BetaDisclaimer compact />
      <TextMessageList messages={messages} />
      <TextCorrectionCards items={corrections} encouragement="Nice effort — one small tweak will sound more natural." />
      <VoxaButton title="Send" containerStyle={styles.frameGap} />
    </View>
  );
}

function VoicePlaybackFrame() {
  return (
    <View style={styles.frameInner}>
      <VoxaText variant="caption" style={styles.overline}>
        Lecture · Greetings
      </VoxaText>
      <GlassPanel style={styles.lectureBubble}>
        <VoxaText variant="body">
          Start with “Hola” — the universal hello. Add “Buenos días” before noon or “Buenas tardes” in the afternoon.
        </VoxaText>
        <VoxaText variant="caption" style={styles.hearLabel}>
          Hear this · manual playback
        </VoxaText>
      </GlassPanel>
      <VoxaButton title="▶ Hear this response" variant="ghost" />
      <VoxaText variant="muted">Voice playback is manual — tap when you want audio.</VoxaText>
    </View>
  );
}

function ProgressFrame() {
  return (
    <View style={styles.frameInner}>
      <VoxaText variant="caption" style={styles.overline}>
        Momentum
      </VoxaText>
      <VoxaText variant="title">Confidence, measured gently</VoxaText>
      <BetaDisclaimer compact />
      <View style={styles.progressRow}>
        <GlassPanel style={styles.tile}>
          <VoxaText variant="caption">Streak</VoxaText>
          <VoxaText variant="hero">4</VoxaText>
          <VoxaText variant="muted">days speaking</VoxaText>
        </GlassPanel>
        <GlassPanel style={styles.tile}>
          <VoxaText variant="caption">XP</VoxaText>
          <VoxaText variant="hero">120</VoxaText>
          <VoxaText variant="muted">lifetime</VoxaText>
        </GlassPanel>
      </View>
      <GlassPanel>
        <VoxaText variant="lead">Recent session</VoxaText>
        <VoxaText variant="body">Networking · completed · +20 XP</VoxaText>
        <VoxaText variant="muted">Yesterday · Text practice</VoxaText>
      </GlassPanel>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  banner: {
    textAlign: 'center',
    opacity: 0.65,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  tabs: {
    gap: spacing.xs,
    paddingBottom: spacing.sm,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: palette.frost,
  },
  tabActive: {
    backgroundColor: 'rgba(59, 108, 255, 0.35)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.cyanMuted,
  },
  tabText: {
    opacity: 0.75,
  },
  tabTextActive: {
    fontWeight: '600',
  },
  frameScroll: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  frame: {
    flex: 1,
  },
  frameInner: {
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  frameGap: {
    marginTop: spacing.sm,
  },
  overline: {
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  coachRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  coachLabel: {
    letterSpacing: 1,
    textTransform: 'uppercase',
    flex: 1,
  },
  choiceCard: {
    borderRadius: radii.lg,
    gap: spacing.xs,
  },
  choiceActive: {
    borderColor: palette.electricBlue,
    borderWidth: 1,
  },
  connector: {
    width: 2,
    height: spacing.md,
    backgroundColor: 'rgba(56, 217, 255, 0.25)',
    alignSelf: 'center',
  },
  lectureBubble: {
    gap: spacing.sm,
  },
  hearLabel: {
    color: palette.cyan,
    fontWeight: '600',
  },
  progressRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  tile: {
    flex: 1,
    gap: spacing.xs,
  },
});
