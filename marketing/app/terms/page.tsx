import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms — Voxa',
  description: 'Terms of service for Voxa (placeholder).',
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs font-medium uppercase tracking-wider text-cyan">Legal</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold text-text">
        Terms of service
      </h1>
      <p className="mt-4 text-sm text-textMuted">Last updated: {new Date().toISOString().slice(0, 10)} · Placeholder</p>
      <div className="mt-10 space-y-6 text-sm leading-relaxed text-textSecondary">
        <p>
          This is a <strong className="text-text">placeholder terms of service</strong> for the Voxa marketing site and
          beta program. Replace with counsel-reviewed terms before general availability.
        </p>
        <p>
          <strong className="text-text">Beta:</strong> TestFlight builds may be incomplete or unstable. You use prerelease
          software at your own discretion.
        </p>
        <p>
          <strong className="text-text">Not professional advice:</strong> Voxa is a language practice tool, not a
          certified course, test, or human instruction substitute.
        </p>
        <p>
          <Link href="/" className="text-cyan hover:underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
