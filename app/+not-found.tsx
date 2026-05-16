import { Stack, router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { GradientBackground } from '@/components/ui/GradientBackground';
import { VoxaButton } from '@/components/ui/VoxaButton';
import { VoxaText } from '@/components/ui/VoxaText';
import { spacing } from '@/constants/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: '', headerShown: false }} />
      <GradientBackground>
        <View style={styles.container}>
          <VoxaText variant="title" style={styles.title}>
            This path does not exist.
          </VoxaText>
          <VoxaText variant="body" style={styles.sub}>
            Let us get you back to practice.
          </VoxaText>
          <VoxaButton title="Return" containerStyle={styles.cta} onPress={() => router.replace('/')} />
        </View>
      </GradientBackground>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  title: {
    textAlign: 'center',
  },
  sub: {
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  cta: {
    marginTop: spacing.xl,
    minWidth: 220,
  },
});
