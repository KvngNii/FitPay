import Link from 'next/link'
import { CalendarCheck, TrendingUp, Shield, Smartphone, Dumbbell, ChevronRight, Zap } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 overflow-x-hidden">

      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <span className="glow-text font-bold text-lg tracking-tight">FitPay</span>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-slate-400 hover:text-slate-200 transition-colors hidden sm:block"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 px-4 py-1.5 rounded-lg hover:from-emerald-400 hover:to-teal-300 transition-all shadow-md shadow-emerald-500/20"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-28 pb-20 px-5 text-center overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 55% at 50% -5%, rgba(16,185,129,0.18), transparent), radial-gradient(ellipse 50% 40% at 85% 10%, rgba(20,184,166,0.1), transparent)',
          }}
        />

        <div className="relative max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium px-3 py-1.5 rounded-full mb-7 animate-fade-in-up">
            <Zap size={11} />
            Built for personal trainers in Accra, Ghana
          </div>

          <h1
            className="text-[2.8rem] sm:text-6xl leading-[1.08] tracking-tight mb-5 animate-fade-in-up"
            style={{ animationDelay: '60ms', fontWeight: 900 }}
          >
            Train harder.{' '}
            <span className="glow-text" style={{ fontWeight: 500 }}>
              Pay smarter.
            </span>
          </h1>

          <p
            className="text-slate-400 text-lg leading-relaxed mb-8 max-w-sm mx-auto animate-fade-in-up"
            style={{ animationDelay: '120ms' }}
          >
            FitPay handles session booking, payments, and progress tracking — so you and your trainer can focus on results.
          </p>

          <div
            className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 animate-fade-in-up"
            style={{ animationDelay: '180ms' }}
          >
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-semibold px-6 py-3 rounded-lg hover:from-emerald-400 hover:to-teal-300 transition-all shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5 active:translate-y-0"
            >
              Start for free
              <ChevronRight size={16} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-slate-800/60 text-slate-300 font-medium px-6 py-3 rounded-lg border border-slate-700 hover:border-slate-600 hover:text-slate-50 transition-all"
            >
              Trainer login
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="px-5 py-16 max-w-5xl mx-auto">
        <p className="text-center text-xs font-semibold text-slate-500 uppercase tracking-widest mb-10">
          Everything in one place
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              Icon: CalendarCheck,
              title: 'Book sessions',
              desc: 'Schedule with your trainer from the app or dial a USSD code — no internet needed.',
            },
            {
              Icon: TrendingUp,
              title: 'Track progress',
              desc: 'Your trainer logs every session. Your plan adapts as you get stronger.',
            },
            {
              Icon: Shield,
              title: 'Pay securely',
              desc: 'Mobile money payments via Moolre. Fast, safe, and confirmed instantly.',
            },
          ].map(({ Icon, title, desc }, i) => (
            <div
              key={title}
              className="card p-5 animate-fade-in-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-400/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                <Icon size={18} className="text-emerald-400" />
              </div>
              <h3 className="font-semibold text-slate-50 mb-1.5">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── USSD Section ── */}
      <section className="px-5 py-16 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 55% 70% at 0% 50%, rgba(16,185,129,0.07), transparent)',
          }}
        />
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

          {/* Phone mockup */}
          <div className="flex justify-center order-last md:order-first">
            <div className="w-52 bg-slate-900 border border-slate-700/80 rounded-3xl p-3 shadow-2xl shadow-black/50">
              {/* Speaker */}
              <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-3" />
              {/* Screen */}
              <div className="bg-slate-800 rounded-xl p-4 min-h-[200px] flex flex-col">
                <p className="text-slate-500 text-[10px] font-medium mb-1 uppercase tracking-widest">MTN USSD</p>
                <div className="font-mono text-xs text-slate-200 leading-6 flex-1">
                  <p className="font-bold text-emerald-400 mb-1">FitPay</p>
                  <p>1. Book a session</p>
                  <p>2. View my plan</p>
                  <p>3. Session balance</p>
                  <p>4. Buy sessions</p>
                  <p className="text-slate-500">0. Exit</p>
                </div>
              </div>
              {/* Keypad */}
              <div className="mt-2 grid grid-cols-3 gap-1 px-1">
                {['1','2','3','4','5','6','7','8','9','*','0','#'].map((k) => (
                  <div
                    key={k}
                    className="h-7 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-400 flex items-center justify-center font-mono"
                  >
                    {k}
                  </div>
                ))}
              </div>
              {/* Home bar */}
              <div className="w-20 h-1 bg-slate-700 rounded-full mx-auto mt-3" />
            </div>
          </div>

          {/* Copy */}
          <div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium px-3 py-1.5 rounded-full mb-5">
              <Smartphone size={11} />
              No internet required
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3 leading-tight">
              Works on <span className="glow-text">any phone</span>
            </h2>
            <p className="text-slate-400 leading-relaxed mb-5">
              Clients without smartphones can still book sessions and buy packages — just dial{' '}
              <span className="text-emerald-400 font-mono text-sm bg-emerald-500/10 px-1.5 py-0.5 rounded">
                *919*4012#
              </span>{' '}
              from any MTN, AirtelTigo, or Telecel number.
            </p>
            <p className="text-slate-500 text-sm">
              No data. No app. No problem.
            </p>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="px-5 py-16 max-w-lg mx-auto">
        <p className="text-center text-xs font-semibold text-slate-500 uppercase tracking-widest mb-10">
          How it works
        </p>
        <div className="space-y-8">
          {[
            {
              title: 'Sign up',
              desc: 'Create your account with your phone number and tell us your fitness goal.',
            },
            {
              title: 'Buy a package',
              desc: 'Pay for a session bundle with mobile money. Sessions are credited instantly.',
            },
            {
              title: 'Train and grow',
              desc: 'Book sessions, train with your PT, and watch your personalised plan evolve after every workout.',
            },
          ].map(({ title, desc }, i) => (
            <div key={title} className="flex gap-4 items-start">
              <div className="shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20">
                {i + 1}
              </div>
              <div className="pt-1">
                <h3 className="font-semibold text-slate-50 mb-1">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-5 py-16">
        <div className="max-w-md mx-auto">
          <div className="relative card py-10 px-8 text-center overflow-hidden">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(16,185,129,0.12), transparent)',
              }}
            />
            <div className="relative">
              <Dumbbell size={28} className="mx-auto text-emerald-400 mb-4 animate-pulse-glow" />
              <h2 className="text-2xl font-bold mb-2 tracking-tight">Ready to start?</h2>
              <p className="text-slate-400 text-sm mb-7 leading-relaxed">
                Join FitPay and get your first session booked in under 2 minutes.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-semibold px-8 py-3 rounded-lg hover:from-emerald-400 hover:to-teal-300 transition-all shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5 active:translate-y-0"
              >
                Create free account
                <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800/60 px-5 py-8 text-center text-slate-500 text-sm">
        <p className="mb-1">
          <span className="glow-text font-semibold">FitPay</span> — Personal training, simplified.
        </p>
        <p>Built for Accra, Ghana · Powered by Moolre · © 2026</p>
      </footer>

    </div>
  )
}
