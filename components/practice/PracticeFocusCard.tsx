import { StyleSheet } from 'react-native';

import { GlassPanel } from '@/components/ui/GlassPanel';
import { VoxaText } from '@/components/ui/VoxaText';
import { palette, radii, spacing } from '@/constants/theme';

type Props = {
  focus?: string | null;
  mission?: string | null;
};

export function PracticeFocusCard({ focus, mission }: Props) {
  const cleanFocus = focus?.trim();
  const cleanMission = mission?.trim();

  if (!cleanFocus && !cleanMission) return null;

  return (
    <GlassPanel style={styles.card} intensity={34}>
      <VoxaText variant="caption" style={styles.overline}>
        Coach focus
      </VoxaText>
      {cleanFocus ? (
        <VoxaText variant="lead" style={styles.focus}>
          {cleanFocus}
        </VoxaText>
      ) : null}
      {cleanMission ? (
        <VoxaText variant="muted" style={cleanFocus ? styles.mission : undefined}>
          {cleanMission}
        </VoxaText>
      ) : null}
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderColor: palette.cyanMuted,
    backgroundColor: 'rgba(56, 217, 255, 0.06)',
  },
  overline: {
    color: palette.cyan,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  focus: {
    color: palette.textPrimary,
    fontWeight: '700',
  },
  mission: {
    marginTop: spacing.xs,
  },
});
