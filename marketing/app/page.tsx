import Link from 'next/link';

import { WaitlistForm } from '@/components/waitlist-form';

function PhoneMockup({ label }: { label: string }) {
  return (
    <div className="relative mx-auto w-[220px] shrink-0 sm:w-[260px]">
      <div
        className="absolute -inset-px rounded-[2.25rem] bg-gradient-to-br from-electric/50 via-cyan/30 to-electric/20 opacity-80 blur-sm"
        aria-hidden
      />
      <div className="relative overflow-hidden rounded-[2.2rem] border border-white/15 bg-deepIndigo shadow-glow">
        <div className="aspect-[9/19] bg-gradient-to-b from-indigo/80 to-void p-4 pt-8">
          <div className="mx-auto h-1 w-12 rounded-full bg-white/20" />
          <div className="mt-6 space-y-3 px-2">
            <div className="h-3 w-4/5 max-w-[85%] rounded-full bg-white/10" />
            <div className="h-3 w-3/5 max-w-[55%] rounded-full bg-white/10" />
            <div className="mt-6 h-24 rounded-2xl bg-gradient-card border border-white/10" />
            <div className="h-16 rounded-2xl bg-white/5" />
          </div>
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-textMuted">{label}</p>
    </div>
  );
}

const features = [
  { title: 'Live AI voice practice', body: 'Speak in real time — not chat bubbles.' },
  { title: 'Soft corrections', body: 'Gentle nudges that keep you in flow.' },
  { title: 'Pronunciation feedback', body: 'Hear what to adjust without harsh drills.' },
  { title: 'XP and streaks', body: 'Light structure that rewards showing up.' },
  { title: 'Conversation history', body: 'Revisit practice and notice progress.' },
  { title: 'Real-world scenarios', body: 'Job interviews, meetings, travel, and more.' },
];

const faqItems = [
  {
    q: 'Is Voxa a certified language test?',
    a: 'No. Voxa is practice software — not an exam or certificate program.',
  },
  {
    q: 'Does Voxa replace a human teacher?',
    a: 'No. It complements tutors, classes, and immersion. Best for reps between real conversations.',
  },
  {
    q: 'Which languages are launching first?',
    a: 'We’re focused on Business English, conversational Spanish, and conversational Mandarin. More paths may follow.',
  },
  {
    q: 'Is this available on iPhone?',
    a: 'Yes. We’re shipping via TestFlight first, with App Store to follow.',
  },
  {
    q: 'Does voice work on the web?',
    a: 'Not yet. Voxa is mobile-first; live voice runs in the native app.',
  },
];

export default function HomePage() {
  return (
    <>
      <section className="relative px-4 pb-24 pt-12 sm:px-6 sm:pt-20 md:pb-32">
        <div className="mx-auto max-w-6xl">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-cyan/90">AI speaking practice</p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold leading-tight tracking-tight text-text sm:text-5xl md:text-6xl md:leading-[1.08]">
            Speak naturally{' '}
            <span className="text-gradient">with AI.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-textSecondary sm:text-xl">
            Voxa helps you practice real conversations in Business English, Spanish, and Mandarin with live AI voice
            coaching.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href="/#beta"
              className="inline-flex justify-center rounded-full bg-gradient-cta px-8 py-3.5 text-base font-semibold text-void shadow-glow transition hover:opacity-95">
              Join the TestFlight beta
            </Link>
            <Link
              href="/#how-it-works"
              className="inline-flex justify-center rounded-full border border-white/20 px-8 py-3.5 text-base font-medium text-text transition hover:border-cyan/50 hover:text-cyan">
              See how it works
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-white/5 bg-deepIndigo/40 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-text sm:text-3xl">
            Speaking stays hard when practice doesn’t feel real.
          </h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {[
              'Embarrassment and fear of mistakes keep many learners quiet — even after years of study.',
              'Textbooks and apps rarely recreate the pace, overlap, and pressure of real dialogue.',
              'Voxa is for the moment you need to open your mouth — not just swipe to the next card.',
            ].map((copy) => (
              <p key={copy.slice(0, 24)} className="glass rounded-2xl p-6 text-sm leading-relaxed text-textSecondary">
                {copy}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-text sm:text-3xl">
            How it works
          </h2>
          <ol className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              { step: '1', title: 'Pick your goal', body: 'Align practice with the conversations you actually need.' },
              { step: '2', title: 'Choose a scenario', body: 'Meetings, interviews, small talk — context that sticks.' },
              {
                step: '3',
                title: 'Speak with AI',
                body: 'Get soft corrections and pointers without breaking your rhythm.',
              },
            ].map((item) => (
              <li key={item.step} className="glass-strong relative rounded-2xl p-8">
                <span className="text-4xl font-light text-electric/80">{item.step}</span>
                <h3 className="mt-4 font-[family-name:var(--font-display)] text-xl font-semibold text-text">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-textSecondary">{item.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="languages" className="scroll-mt-24 border-t border-white/5 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-text sm:text-3xl">
            Language paths
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {['Business English', 'Conversational Spanish', 'Conversational Mandarin'].map((title) => (
              <div
                key={title}
                className="glass rounded-2xl bg-gradient-card p-8 transition hover:border-cyan/30 hover:shadow-glow">
                <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-text">{title}</h3>
                <p className="mt-2 text-sm text-textMuted">Live voice scenarios tuned for real-world use.</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-text sm:text-3xl">
            Built for confident speaking
          </h2>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <li key={f.title} className="glass rounded-2xl p-6">
                <h3 className="font-medium text-text">{f.title}</h3>
                <p className="mt-2 text-sm text-textSecondary">{f.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-y border-white/5 bg-deepIndigo/30 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-text sm:text-3xl">
            Preview screens
          </h2>
          <p className="mt-3 max-w-2xl text-textSecondary">
            Placeholder mockups — not live product shots. Final UI may change before launch.
          </p>
          <div className="mt-14 flex flex-wrap justify-center gap-10 md:gap-14">
            <PhoneMockup label="Practice hub" />
            <PhoneMockup label="Live session" />
            <PhoneMockup label="Progress" />
          </div>
        </div>
      </section>

      <section id="beta" className="scroll-mt-24 px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-text sm:text-3xl">
            Join the TestFlight beta
          </h2>
          <p className="mt-4 text-textSecondary">Be among the first to practice with Voxa on iPhone.</p>
          <div className="mt-10">
            <WaitlistForm />
          </div>
        </div>
      </section>

      <section id="faq" className="scroll-mt-24 border-t border-white/5 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-text sm:text-3xl">FAQ</h2>
          <dl className="mt-10 space-y-6">
            {faqItems.map((item) => (
              <div key={item.q} className="glass rounded-2xl p-6">
                <dt className="font-medium text-text">{item.q}</dt>
                <dd className="mt-3 text-sm leading-relaxed text-textSecondary">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}
