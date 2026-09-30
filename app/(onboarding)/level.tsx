import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { PracticeLevelPicker } from '@/components/practice/PracticeLevelPicker';
import { BetaDisclaimer } from '@/components/ui/BetaDisclaimer';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { VoxaButton } from '@/components/ui/VoxaButton';
import { VoxaText } from '@/components/ui/VoxaText';
import { spacing } from '@/constants/theme';
import {
  DEFAULT_USER_LEVEL,
  getPreferredLanguage,
  setPreferredLevel,
} from '@/lib/preferences/storage';
import type { UserLevel } from '@/lib/realtime/types';

export default function LevelScreen() {
  const [level, setLevel] = useState<UserLevel>(DEFAULT_USER_LEVEL);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      await getPreferredLanguage();
      setReady(true);
    })();
  }, []);

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <VoxaText variant="caption" style={styles.overline}>
            Step 3 of 4
          </VoxaText>
          <VoxaText variant="title">How much challenge feels right?</VoxaText>
          <VoxaText variant="body">
            Pick a starting point. Voxa can suggest a change later, but it will never switch your level without you.
          </VoxaText>
        </View>

        <GlassPanel style={styles.card}>
          <PracticeLevelPicker value={level} onChange={setLevel} showDescriptions />
        </GlassPanel>

        <VoxaButton
          title="Continue"
          disabled={!ready}
          onPress={async () => {
            const language = await getPreferredLanguage();
            if (language) {
              await setPreferredLevel(language, level);
            }
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
  header: { gap: spacing.sm },
  overline: { letterSpacing: 1.2, textTransform: 'uppercase' },
  card: { gap: spacing.md },
});
