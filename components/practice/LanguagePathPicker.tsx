import { Pressable, StyleSheet, View } from 'react-native';

import { VoxaText } from '@/components/ui/VoxaText';
import { LAUNCH_LANGUAGES, type LaunchLanguage } from '@/constants/scenarios';
import { palette, radii, spacing } from '@/constants/theme';

type Props = {
  value: LaunchLanguage;
  onChange: (lang: LaunchLanguage) => void;
};

export function LanguagePathPicker({ value, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      <VoxaText variant="caption" style={styles.label}>
        Learning path
      </VoxaText>
      <View style={styles.row}>
        {LAUNCH_LANGUAGES.map((lang) => {
          const active = value === lang.id;
          return (
            <Pressable
              key={lang.id}
              onPress={() => onChange(lang.id)}
              style={[styles.chip, active && styles.chipActive]}>
              <VoxaText variant="caption" style={[styles.chipText, active && styles.chipTextActive]}>
                {lang.id === 'english_business' ? 'Business English' : lang.id === 'spanish' ? 'Spanish' : 'Mandarin'}
              </VoxaText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  label: {
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    opacity: 0.85,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderRadius: radii.full,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.frostStrong,
    backgroundColor: palette.frost,
  },
  chipActive: {
    borderColor: palette.cyan,
    backgroundColor: 'rgba(56, 217, 255, 0.12)',
  },
  chipText: {
    color: palette.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: palette.cyan,
  },
});
