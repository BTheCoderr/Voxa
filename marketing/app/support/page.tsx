import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Support — Voxa',
  description: 'Contact and support for Voxa.',
};

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs font-medium uppercase tracking-wider text-cyan">Help</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold text-text">Support</h1>
      <div className="glass mt-10 rounded-2xl p-8">
        <p className="text-sm text-textSecondary">
          For beta access, product questions, or press, reach out at:
        </p>
        <p className="mt-4">
          <a href="mailto:support@voxa.app" className="text-lg font-medium text-cyan hover:underline">
            support@voxa.app
          </a>
        </p>
        <p className="mt-4 text-xs text-textMuted">
          (Placeholder address — replace with your real inbox or forwarding through your domain.)
        </p>
        <p className="mt-8 text-sm text-textSecondary">
          Technical issues with TestFlight builds may require including your iOS version and a short screen recording
          (if applicable).
        </p>
      </div>
      <p className="mt-8">
        <Link href="/" className="text-cyan hover:underline">
          ← Back to home
        </Link>
      </p>
    </div>
  );
}
