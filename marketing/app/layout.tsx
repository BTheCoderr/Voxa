import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { DM_Sans, Outfit } from 'next/font/google';

import './globals.css';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Voxa — Speak naturally with AI',
  description:
    'Practice real conversations in Business English, Spanish, and Mandarin with live AI voice coaching. Join the TestFlight beta.',
  openGraph: {
    title: 'Voxa — Speak naturally with AI',
    description:
      'AI-powered speaking practice. Calm, premium voice coaching for real-world scenarios.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${dmSans.variable}`}>
      <body className="min-h-screen font-[family-name:var(--font-body)]">
        <div className="relative min-h-screen bg-gradient-mesh bg-void">
          <div className="pointer-events-none fixed inset-0 bg-gradient-radial" aria-hidden />
          <div className="relative z-10 flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </div>
      </body>
    </html>
  );
}
