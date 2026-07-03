'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ShoppingBag, CalendarPlus, Dumbbell, LineChart, ChevronRight, Zap } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/client/packages', label: 'Buy a Package', desc: 'Browse session packages', Icon: ShoppingBag },
  { href: '/client/book', label: 'Book a Session', desc: 'Schedule your next workout', Icon: CalendarPlus },
  { href: '/client/plan', label: 'My Plan', desc: 'View your workout plan', Icon: Dumbbell },
  { href: '/client/progress', label: 'Progress', desc: 'Track your results', Icon: LineChart },
]

export default function ClientDashboard() {
  const router = useRouter()

  useEffect(() => {
    async function checkMedicalHistory() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('medical_history')
        .select('id')
        .eq('client_id', user.id)
        .maybeSingle()

      if (!data) router.replace('/onboarding/medical-history')
    }
    checkMedicalHistory()
  }, [router])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <main className="p-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6 animate-fade-in-up">
        <h1 className="text-2xl font-bold glow-text flex items-center gap-2">
          FitPay
          <Zap size={18} className="text-emerald-400 animate-pulse-glow" />
        </h1>
        <div className="flex items-center gap-4">
          <Link href="/client/profile" className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
            Profile
          </Link>
          <button
            onClick={handleSignOut}
            className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {NAV_ITEMS.map(({ href, label, desc, Icon }, i) => (
          <Link
            key={href}
            href={href}
            className="card-interactive flex items-center justify-between animate-fade-in-up"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center gap-3">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-400/10 border border-emerald-500/20 flex items-center justify-center">
                <Icon size={18} className="text-emerald-400" />
              </div>
              <div>
                <p className="font-semibold text-slate-50">{label}</p>
                <p className="text-sm text-slate-400 mt-0.5">{desc}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-500" />
          </Link>
        ))}
      </div>
    </main>
  )
}
