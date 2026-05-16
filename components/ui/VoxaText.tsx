import { Text, type TextProps } from 'react-native';

import { palette, typography } from '@/constants/theme';

type Variant = 'hero' | 'title' | 'lead' | 'body' | 'muted' | 'caption';

type Props = Omit<TextProps, 'role'> & {
  variant?: Variant;
};

export function VoxaText({ variant = 'body', style, children, ...rest }: Props) {
  const mapped = {
    hero: styles.hero,
    title: styles.title,
    lead: styles.lead,
    body: styles.body,
    muted: styles.muted,
    caption: styles.caption,
  }[variant];

  return (
    <Text style={[mapped, style]} {...rest}>
      {children}
    </Text>
  );
}

const styles = {
  hero: {
    color: palette.textPrimary,
    fontSize: typography.sizes.hero,
    fontWeight: '700' as const,
    letterSpacing: -0.6,
    lineHeight: 38,
  },
  title: {
    color: palette.textPrimary,
    fontSize: typography.sizes.title,
    fontWeight: '600' as const,
    letterSpacing: -0.25,
    lineHeight: 30,
  },
  lead: {
    color: palette.textSecondary,
    fontSize: typography.sizes.lead,
    fontWeight: '400' as const,
    lineHeight: 26,
  },
  body: {
    color: palette.textSecondary,
    fontSize: typography.sizes.body,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  muted: {
    color: palette.textMuted,
    fontSize: typography.sizes.body,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  caption: {
    color: palette.textMuted,
    fontSize: typography.sizes.caption,
    fontWeight: '500' as const,
    lineHeight: 18,
    letterSpacing: 0.15,
  },
};
