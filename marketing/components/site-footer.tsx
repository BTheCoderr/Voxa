import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-deepIndigo/60 py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div>
            <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-text">Voxa</p>
            <p className="mt-2 max-w-xs text-sm text-textMuted">Practice real conversations with AI. Mobile-first.</p>
          </div>
          <div className="flex flex-wrap gap-x-12 gap-y-6 text-sm">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-textMuted">Legal</span>
              <Link href="/privacy/" className="text-textSecondary hover:text-cyan">
                Privacy
              </Link>
              <Link href="/terms/" className="text-textSecondary hover:text-cyan">
                Terms
              </Link>
              <Link href="/support/" className="text-textSecondary hover:text-cyan">
                Support
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-textMuted">Product</span>
              <Link href="/#beta" className="text-textSecondary hover:text-cyan">
                TestFlight beta
              </Link>
              <a
                href="https://github.com/BTheCoderr/Voxa"
                className="text-textSecondary hover:text-cyan"
                target="_blank"
                rel="noreferrer">
                GitHub
              </a>
            </div>
          </div>
        </div>
        <p className="mt-12 text-center text-xs text-textMuted md:text-left">
          Built by Baheem Ferrell · {new Date().getFullYear()} Voxa
        </p>
      </div>
    </footer>
  );
}
