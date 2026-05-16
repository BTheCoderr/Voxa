import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy — Voxa',
  description: 'Privacy policy for Voxa (placeholder).',
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs font-medium uppercase tracking-wider text-cyan">Legal</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold text-text">
        Privacy policy
      </h1>
      <p className="mt-4 text-sm text-textMuted">Last updated: {new Date().toISOString().slice(0, 10)} · Placeholder</p>
      <div className="mt-10 space-y-6 text-sm leading-relaxed text-textSecondary">
        <p>
          This is a <strong className="text-text">placeholder privacy policy</strong> for the Voxa marketing site. Replace
          with counsel-reviewed text before collecting real user data or launching publicly.
        </p>
        <p>
          <strong className="text-text">What we might collect:</strong> If you submit the beta waitlist form, your email
          may be stored by our hosting provider (e.g. Netlify Forms) or a future backend. Audio and conversation data
          from the mobile app are governed by the in-app terms and product privacy policy when published.
        </p>
        <p>
          <strong className="text-text">Contact:</strong> For privacy questions, use the email on the{' '}
          <Link href="/support/" className="text-cyan hover:underline">
            Support
          </Link>{' '}
          page.
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
