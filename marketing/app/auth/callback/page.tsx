'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

/**
 * Fallback when Supabase magic link uses **Site URL** (e.g. Netlify) instead of `voxa://`.
 * Forwards hash/query (tokens) into the native app deep link.
 */
export default function WebAuthCallbackBridge() {
  const [deeplink, setDeeplink] = useState('voxa://auth/callback');
  const [status, setStatus] = useState('Opening the Voxa app…');

  useEffect(() => {
    const target = `voxa://auth/callback${window.location.search}${window.location.hash}`;
    setDeeplink(target);
    window.location.replace(target);
    const t = window.setTimeout(() => {
      setStatus(
        'If the app did not open, make sure Voxa is installed. You can also open the link again from your email.',
      );
    }, 3500);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-mesh px-6 text-center text-text">
      <p className="font-[family-name:var(--font-display)] text-xl font-semibold">Sign-in redirect</p>
      <p className="mt-4 max-w-md text-sm text-textSecondary">{status}</p>
      <a
        href={deeplink}
        className="mt-8 rounded-full bg-gradient-cta px-8 py-3 text-sm font-semibold text-void shadow-glow">
        Open Voxa
      </a>
      <Link href="/" className="mt-6 text-sm text-cyan hover:underline">
        Back to home
      </Link>
    </main>
  );
}
