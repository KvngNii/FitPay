'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ClientDashboard() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <main className="p-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-emerald-400">FitPay</h1>
        <button
          onClick={handleSignOut}
          className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          Sign out
        </button>
      </div>

      <div className="space-y-3">
        <Link href="/client/packages" className="card flex items-center justify-between hover:border-emerald-500/40 transition-colors">
          <div>
            <p className="font-semibold text-slate-50">Buy a Package</p>
            <p className="text-sm text-slate-400 mt-0.5">Browse session packages</p>
          </div>
          <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <Link href="/client/book" className="card flex items-center justify-between hover:border-emerald-500/40 transition-colors">
          <div>
            <p className="font-semibold text-slate-50">Book a Session</p>
            <p className="text-sm text-slate-400 mt-0.5">Schedule your next workout</p>
          </div>
          <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <Link href="/client/plan" className="card flex items-center justify-between hover:border-emerald-500/40 transition-colors">
          <div>
            <p className="font-semibold text-slate-50">My Plan</p>
            <p className="text-sm text-slate-400 mt-0.5">View your workout plan</p>
          </div>
          <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <Link href="/client/progress" className="card flex items-center justify-between hover:border-emerald-500/40 transition-colors">
          <div>
            <p className="font-semibold text-slate-50">Progress</p>
            <p className="text-sm text-slate-400 mt-0.5">Track your results</p>
          </div>
          <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </main>
  )
}
