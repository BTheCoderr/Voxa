'use client';

export function WaitlistForm() {
  return (
    <form
      name="waitlist"
      method="POST"
      data-netlify="true"
      data-netlify-honeypot="bot-field"
      className="glass mx-auto flex max-w-md flex-col gap-4 rounded-2xl p-6 sm:p-8">
      <input type="hidden" name="form-name" value="waitlist" />
      <p className="hidden">
        <label>
          Don’t fill this out: <input name="bot-field" />
        </label>
      </p>
      <label className="flex flex-col gap-2 text-left text-sm">
        <span className="text-textMuted">Email</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-text placeholder:text-textMuted outline-none ring-electric/40 transition focus:ring-2"
        />
      </label>
      <button
        type="submit"
        className="mt-2 rounded-xl bg-gradient-cta py-3.5 text-base font-semibold text-void shadow-glow transition hover:opacity-95">
        Request TestFlight access
      </button>
      <p className="text-center text-xs text-textMuted">
        We’ll email you when a TestFlight slot opens. No spam.
      </p>
    </form>
  );
}
