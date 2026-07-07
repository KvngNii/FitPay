import type { Metadata } from 'next'
import Link from 'next/link'
import { Big_Shoulders_Display, Archivo, IBM_Plex_Mono } from 'next/font/google'
import LandingScripts from './LandingScripts'
import './landing.css'

const display = Big_Shoulders_Display({ subsets: ['latin'], weight: ['600', '800'], variable: '--font-display' })
const body = Archivo({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-body' })
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'FitPay: Get paid like you train',
  description:
    'FitPay runs your client roster, your programming, and your money in one place. Clients pay from any phone by dialing *919*4012#, with Moolre USSD, SMS and mobile money built in.',
}

const KEYS = [
  { n: '1' }, { n: '2', s: 'abc' }, { n: '3', s: 'def' },
  { n: '4', s: 'ghi' }, { n: '5', s: 'jkl' }, { n: '6', s: 'mno' },
  { n: '7', s: 'pqrs' }, { n: '8', s: 'tuv' }, { n: '9', s: 'wxyz' },
  { n: '*' }, { n: '0', s: '+' }, { n: '#' },
]

export default function LandingPage() {
  return (
    <div className={`landing ${display.variable} ${body.variable} ${mono.variable}`}>
      <header className="topbar">
        <div className="wrap topbar-inner">
          <a className="logo" href="#top">Fit<em>Pay</em></a>
          <span className="top-code">any phone · <strong>*919*4012#</strong> · no app needed</span>
        </div>
      </header>

      <main id="top">
        {/* HERO */}
        <section className="hero" style={{ padding: 0 }}>
          <div className="wrap hero-inner">
            <div>
              <span className="eyebrow">Built for trainers in Ghana</span>
              <h1>Get paid<br />like you<br /><span className="accent">train.</span></h1>
              <p className="hero-sub">
                FitPay runs your client roster, your programming, and your money in one place.
                Your clients can <strong>dial a code on any phone</strong> to book sessions and buy
                packages, with Moolre USSD, SMS and mobile money built in from day one, not bolted on later.
              </p>
              <div className="hero-cta-row">
                <Link className="l-btn l-btn-primary" href="/signup">Create your free account</Link>
                <a className="l-btn l-btn-ghost" href="#how">See how it works</a>
              </div>
              <p className="hero-note" style={{ marginTop: 22 }}>
                Live in Accra · GHS pricing · clients need no app and no data
              </p>
            </div>
            <div className="phone-col">
              <div>
                <div className="phone" aria-hidden="true">
                  <div className="phone-brand">Dual Sim · 2G</div>
                  <div className="screen" id="ussdScreen" />
                  <div className="keypad">
                    {KEYS.map((k) => (
                      <div className="key" key={k.n}>{k.n}{k.s && <span>{k.s}</span>}</div>
                    ))}
                  </div>
                </div>
                <p className="phone-caption">The real FitPay USSD flow. No smartphone, no data bundle, no excuses.</p>
              </div>
            </div>
          </div>
        </section>

        {/* PROBLEM */}
        <section className="problem">
          <div className="wrap">
            <span className="section-kicker">The part nobody posts about</span>
            <h2 className="section-head reveal">Chasing fees is not part of the job.</h2>
            <div className="rule thin reveal" />
            <div className="problem-grid">
              <div className="reveal">
                <p>You show up at 5am. You program every session. You check in when they go quiet. Then month end comes and you turn into a debt collector in your own WhatsApp, scrolling for who paid, who promised, and who left you on read.</p>
                <p>FitPay takes that whole conversation off your plate. Every client buys a session package up front, every payment is tracked against a Moolre reference, and every confirmation goes out by SMS without you typing a word.</p>
              </div>
              <div className="receipts reveal" aria-label="Examples of payment chasing messages trainers send">
                <div className="r">&quot;Morning boss, just following up on <b>last month&apos;s sessions</b> 🙏&quot;</div>
                <div className="r">&quot;No rush! Whenever <b>momo</b> is convenient&quot;</div>
                <div className="r">&quot;Hey! Did the <b>GHS 250</b> go through? Network was acting up&quot;</div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="how" id="how">
          <div className="wrap">
            <span className="section-kicker" style={{ color: 'var(--ochre)' }}>How it works</span>
            <h2 className="section-head reveal">Three moves. Then it runs itself.</h2>
            <div className="rule reveal" />
            <div className="steps">
              <div className="step reveal">
                <div className="step-num">1</div>
                <h3>Client buys a package</h3>
                <p>From the app, or by dialing the USSD code on any phone. Moolre sends them a mobile money payment link by SMS, and the sessions credit automatically the moment the payment lands.</p>
                <span className="micro">*919*4012# → link by SMS → <b>paid</b></span>
              </div>
              <div className="step reveal">
                <div className="step-num">2</div>
                <h3>Sessions get booked</h3>
                <p>Clients pick a date and an open slot on the calendar, or book by USSD. Every booking is confirmed by SMS and deducted from their package. No group chat scheduling.</p>
                <span className="micro">calendar → open slot → <b>booked</b></span>
              </div>
              <div className="step reveal">
                <div className="step-num">3</div>
                <h3>Plans progress themselves</h3>
                <p>You log each session; the progression engine builds the next one on rules like load, reps and deload timing, so every client moves forward without you rewriting spreadsheets.</p>
                <span className="micro">easy set → <b>+2.5kg</b> → auto</span>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="features">
          <div className="wrap">
            <span className="section-kicker">What you get</span>
            <h2 className="section-head reveal">Built around how training actually works here.</h2>
            <div className="rule thin reveal" />
            <div className="feat-grid">
              <div className="feat reveal">
                <span className="tag">Payments</span>
                <h3>USSD on any phone</h3>
                <p>Clients without smartphones can book sessions, check their balance, view their plan and start a package purchase by dialing *919*4012#. The Moolre payment link arrives by SMS and settles by mobile money on MTN, Telecel or AT.</p>
              </div>
              <div className="feat reveal">
                <span className="tag">Programming</span>
                <h3>A progression engine, not a guess</h3>
                <p>Workouts progress on rules: easy sets add weight or reps, hard sets pull back, and deload weeks land on schedule. Consistent for every client, adjustable in seconds.</p>
              </div>
              <div className="feat reveal">
                <span className="tag">Roster</span>
                <h3>Every client, one screen</h3>
                <p>Sessions completed, sessions left, medical clearance, next booking, refund requests. You see the state of your whole business before your first client arrives.</p>
              </div>
              <div className="feat reveal">
                <span className="tag">SMS</span>
                <h3>Messages that send themselves</h3>
                <p>Booking confirmations and payment links go out automatically by SMS from FitPay&apos;s approved sender ID. You keep the coach relationship, and the system does the admin.</p>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section className="pricing">
          <div className="wrap">
            <span className="section-kicker">Pricing</span>
            <h2 className="section-head reveal">Free to start. Priced in cedis.</h2>
            <div className="rule thin reveal" />
            <div className="price-grid">
              <div className="price-card reveal">
                <span className="tag" style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ochre-deep)' }}>Free</span>
                <div className="price-line">
                  <span className="price-amount">GHS 0</span>
                  <span className="price-per">/ forever · up to 3 clients</span>
                </div>
                <ul className="price-list">
                  <li>Full session booking and calendar</li>
                  <li>Moolre mobile money collection</li>
                  <li>Workout tracking and progression engine</li>
                  <li>USSD access for your clients</li>
                </ul>
                <p className="price-foot">Everything you need to run your first clients.</p>
              </div>
              <div className="price-card reveal">
                <span className="tag" style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ochre-deep)' }}>Pro</span>
                <div className="price-line">
                  <span className="price-amount">GHS 99</span>
                  <span className="price-per">/ month · unlimited clients</span>
                </div>
                <ul className="price-list">
                  <li>Everything in Free</li>
                  <li>Unlimited clients and programs</li>
                  <li>AI progress reports and monthly check ins</li>
                  <li>Bulk SMS reminders</li>
                </ul>
                <p className="price-foot">For the coach whose roster outgrew the group chat.</p>
              </div>
            </div>
            <p className="price-note reveal">Long term, FitPay takes 1% per transaction, so the platform only earns when you do.</p>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="final" id="start">
          <div className="wrap">
            <span className="dial-code reveal">*919*4012#</span>
            <p className="reveal">That&apos;s the whole experience for your clients: book, check balance, buy sessions, from any phone. Yours is even shorter: create an account and start coaching on FitPay today.</p>
            <div className="final-cta-row reveal">
              <Link className="l-btn l-btn-primary" href="/signup">Create your free account</Link>
              <Link className="l-btn l-btn-ghost" href="/login">Log in</Link>
            </div>
            <div className="footer-meta">
              <span>FitPay · Accra, Ghana</span>
              <span>Payments powered by Moolre</span>
              <span>© 2026</span>
            </div>
          </div>
        </section>
      </main>

      <LandingScripts />
    </div>
  )
}
