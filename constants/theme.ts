/**
 * Voxa design tokens — dark-first, calm premium.
 * Avoid "game UI" density; favor breathing room and soft contrast.
 */

export const palette = {
  void: '#070A12',
  deepIndigo: '#0B1020',
  indigo: '#12183A',
  electricBlue: '#3B6CFF',
  cyan: '#38D9FF',
  cyanMuted: 'rgba(56, 217, 255, 0.35)',
  frost: 'rgba(255, 255, 255, 0.08)',
  frostStrong: 'rgba(255, 255, 255, 0.14)',
  textPrimary: '#F4F7FF',
  textSecondary: 'rgba(244, 247, 255, 0.68)',
  textMuted: 'rgba(244, 247, 255, 0.45)',
  danger: '#FF6B6B',
  success: '#5CFFB5',
} as const;

export const gradients = {
  background: ['#070A12', '#0B1020', '#111E3F'] as const,
  accent: ['#3B6CFF', '#38D9FF'] as const,
  orb: ['#3B6CFF', '#6B5CFF', '#38D9FF'] as const,
};

export const radii = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  full: 9999,
} as const;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  xxl: 40,
} as const;

export const typography = {
  /** System stack keeps initial scaffold light; swap for Satoshi/DM sans later. */
  fontFamily: {
    regular: undefined as string | undefined,
    medium: undefined as string | undefined,
    semibold: undefined as string | undefined,
  },
  sizes: {
    caption: 13,
    body: 16,
    lead: 18,
    title: 24,
    hero: 32,
  },
} as const;

export const voxaNavTheme = {
  dark: true,
  colors: {
    primary: palette.electricBlue,
    background: palette.void,
    card: palette.deepIndigo,
    text: palette.textPrimary,
    border: palette.frost,
    notification: palette.cyan,
  },
  fonts: {
    regular: { fontFamily: typography.fontFamily.regular, fontWeight: '400' as const },
    medium: { fontFamily: typography.fontFamily.medium, fontWeight: '500' as const },
    bold: { fontFamily: typography.fontFamily.semibold, fontWeight: '600' as const },
    heavy: { fontFamily: typography.fontFamily.semibold, fontWeight: '700' as const },
  },
};
