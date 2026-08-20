'use client'

import { useEffect, useState } from 'react'
import { Zap } from 'lucide-react'

// Branded launch screen. Renders on top of everything on first load (covering
// the hydration paint), then fades out. Shows once per browser session so
// in-session reloads don't replay it.
export default function SplashScreen() {
  const [phase, setPhase] = useState<'in' | 'out' | 'gone'>('in')

  useEffect(() => {
    if (sessionStorage.getItem('fitpay_splash_shown')) {
      setPhase('gone')
      return
    }
    const toOut = setTimeout(() => setPhase('out'), 1400)
    const toGone = setTimeout(() => {
      sessionStorage.setItem('fitpay_splash_shown', '1')
      setPhase('gone')
    }, 1900)
    return () => {
      clearTimeout(toOut)
      clearTimeout(toGone)
    }
  }, [])

  if (phase === 'gone') return null

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#070d09] transition-opacity duration-500 ${
        phase === 'out' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 42%, rgba(16,185,129,0.16), transparent)' }}
      />

      <div className="relative flex flex-col items-center">
        <div className="relative mb-5">
          <span className="absolute inset-0 rounded-2xl bg-emerald-500/20 blur-xl animate-pulse-glow" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/25 to-teal-400/10 border border-emerald-500/30 flex items-center justify-center animate-scale-in">
            <Zap size={30} className="text-emerald-400" />
          </div>
        </div>

        <h1 className="text-4xl font-bold glow-text tracking-tight animate-fade-in-up">FitPay</h1>
        <p
          className="text-slate-500 text-sm mt-2 animate-fade-in-up"
          style={{ animationDelay: '120ms' }}
        >
          Train. Track. Get paid.
        </p>

        <div className="mt-6 w-32 h-1 rounded-full bg-slate-800 overflow-hidden">
          <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 animate-[splash-loader_1.4s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  )
}
