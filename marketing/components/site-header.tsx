import Link from 'next/link';

const nav = [
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#languages', label: 'Languages' },
  { href: '/#faq', label: 'FAQ' },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-void/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-text">
          Voxa
        </Link>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-textSecondary transition-colors hover:text-text">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/#beta"
            className="rounded-full bg-gradient-cta px-4 py-2 text-sm font-medium text-void shadow-glow transition-opacity hover:opacity-95">
            Join beta
          </Link>
        </div>
      </div>
    </header>
  );
}
