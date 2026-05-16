import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { BetaDisclaimer } from '@/components/ui/BetaDisclaimer';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { VoxaButton } from '@/components/ui/VoxaButton';
import { VoxaText } from '@/components/ui/VoxaText';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { palette, radii, spacing } from '@/constants/theme';
import type { LearningGoal } from '@/lib/preferences/storage';
import { setLearningGoal } from '@/lib/preferences/storage';

const GOALS: { id: LearningGoal; title: string; body: string }[] = [
  {
    id: 'speaking_confidence',
    title: 'Speak aloud without freezing',
    body: 'Warm ups, gentle pacing, and “you’ve got this” coaching.',
  },
  {
    id: 'work_english',
    title: 'Sound capable at work',
    body: 'Meetings, updates, and polite clarity under pressure.',
  },
  {
    id: 'travel',
    title: 'Move through the world',
    body: 'Airports, hotels, transit — fewer awkward stalls.',
  },
  {
    id: 'interviews',
    title: 'Interview with composure',
    body: 'Crisp answers, recoveries, and confident follow-ups.',
  },
];

export default function GoalsScreen() {
  const [selected, setSelected] = useState<LearningGoal | null>(null);

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <VoxaText variant="caption" style={styles.overline}>
            Step 2 of 3
          </VoxaText>
          <VoxaText variant="title">What do you want to feel better at?</VoxaText>
          <VoxaText variant="body">Pick the outcome that matches your next 30 days — you can change this anytime.</VoxaText>
        </View>

        <View style={styles.list}>
          {GOALS.map((goal) => {
            const active = selected === goal.id;
            return (
              <Pressable key={goal.id} onPress={() => setSelected(goal.id)} style={styles.row}>
                <GlassPanel
                  style={[
                    styles.card,
                    active && {
                      borderColor: palette.cyan,
                      borderWidth: 1,
                    },
                  ]}>
                  <VoxaText variant="title" style={styles.goalTitle}>
                    {goal.title}
                  </VoxaText>
                  <VoxaText variant="muted">{goal.body}</VoxaText>
                </GlassPanel>
              </Pressable>
            );
          })}
        </View>

        <VoxaButton
          title="Continue"
          disabled={!selected}
          onPress={async () => {
            if (!selected) return;
            await setLearningGoal(selected);
            router.push('/(onboarding)/microphone');
          }}
        />
        <BetaDisclaimer compact />
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  header: {
    gap: spacing.sm,
  },
  overline: {
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  list: {
    gap: spacing.sm,
  },
  row: {
    borderRadius: radii.lg,
  },
  card: {
    borderRadius: radii.lg,
  },
  goalTitle: {
    marginBottom: spacing.xs,
    fontSize: 18,
  },
});
