import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#070A12',
        deepIndigo: '#0B1020',
        indigo: '#12183A',
        electric: '#3B6CFF',
        cyan: '#38D9FF',
        frost: 'rgba(255, 255, 255, 0.08)',
        frostStrong: 'rgba(255, 255, 255, 0.14)',
        text: '#F4F7FF',
        textSecondary: 'rgba(244, 247, 255, 0.68)',
        textMuted: 'rgba(244, 247, 255, 0.45)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(59, 108, 255, 0.28), transparent 55%)',
        'gradient-mesh':
          'linear-gradient(165deg, #070A12 0%, #0B1020 45%, #111E3F 100%)',
        'gradient-cta': 'linear-gradient(115deg, #3B6CFF 0%, #38D9FF 100%)',
        'gradient-card': 'linear-gradient(145deg, rgba(59, 108, 255, 0.12) 0%, rgba(56, 217, 255, 0.06) 100%)',
      },
      boxShadow: {
        glow: '0 0 80px rgba(56, 217, 255, 0.12), 0 0 40px rgba(59, 108, 255, 0.15)',
        glass: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
      },
    },
  },
  plugins: [],
} satisfies Config;
