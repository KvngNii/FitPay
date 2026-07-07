import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  ShoppingBag,
  CalendarPlus,
  Dumbbell,
  LineChart,
  ChevronRight,
  Zap,
  CalendarClock,
  CheckCircle2,
  Ticket,
} from 'lucide-react'
import SignOutButton from './SignOutButton'

export const dynamic = 'force-dynamic'

// Ghana runs on UTC+0 (no DST), so formatting against Africa/Accra is correct
// regardless of the server's timezone.
const TZ = 'Africa/Accra'

function formatSession(iso: string) {
  const date = new Date(iso)
  const dateStr = date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: TZ,
  })
  const timeStr = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TZ,
  })

  const dayMs = 86_400_000
  const startOfToday = Math.floor(Date.now() / dayMs)
  const startOfSession = Math.floor(date.getTime() / dayMs)
  const days = startOfSession - startOfToday
  const chip = days <= 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days} days`

  return { dateStr, timeStr, chip }
}

const QUICK_ACTIONS = [
  { href: '/client/plan', label: 'My Plan', desc: 'Your next workout', Icon: Dumbbell },
  { href: '/client/progress', label: 'Progress', desc: 'Track your results', Icon: LineChart },
  { href: '/client/packages', label: 'Packages', desc: 'Buy or manage', Icon: ShoppingBag },
  { href: '/client/book', label: 'Book', desc: 'Schedule a session', Icon: CalendarPlus },
]

export default async function ClientDashboard() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Gate on medical history server-side — no dashboard flash before the redirect.
  const { data: medical } = await supabase
    .from('medical_history')
    .select('id')
    .eq('client_id', user.id)
    .maybeSingle()
  if (!medical) redirect('/onboarding/medical-history')

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  const [{ data: profile }, { data: activePurchases }, { data: nextSession }, { count: doneThisMonth }] =
    await Promise.all([
      supabase.from('users').select('name').eq('id', user.id).single(),
      supabase
        .from('purchases')
        .select('sessions_left')
        .eq('client_id', user.id)
        .eq('status', 'active')
        .gt('sessions_left', 0),
      supabase
        .from('sessions')
        .select('scheduled_at')
        .eq('client_id', user.id)
        .eq('status', 'scheduled')
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', user.id)
        .eq('status', 'completed')
        .gte('scheduled_at', monthStart),
    ])

  const firstName = profile?.name?.split(' ')[0] ?? 'there'
  const sessionsLeft = (activePurchases ?? []).reduce((sum, p) => sum + (p.sessions_left ?? 0), 0)
  const next = nextSession ? formatSession(nextSession.scheduled_at) : null
  const completedThisMonth = doneThisMonth ?? 0

  return (
    <main className="p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-fade-in-up">
        <div>
          <div className="flex items-center gap-2">
            <span className="page-title">FitPay</span>
            <Zap size={16} className="text-emerald-400 animate-pulse-glow" />
          </div>
          <p className="text-sm text-slate-400 mt-0.5">Welcome back, {firstName}</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/client/profile" className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
            Profile
          </Link>
          <SignOutButton />
        </div>
      </div>

      {/* Session balance hero */}
      <div
        className="relative overflow-hidden rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/[0.12] via-slate-900 to-slate-900 p-5 mb-4 animate-fade-in-up"
        style={{ animationDelay: '60ms' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 60% at 85% 0%, rgba(16,185,129,0.14), transparent)' }}
        />
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-emerald-400 mb-1">
              <Ticket size={14} />
              <span className="text-xs font-semibold uppercase tracking-wider">Sessions left</span>
            </div>
            <p className="text-4xl font-bold glow-text leading-none tabular-nums">{sessionsLeft}</p>
            <p className="text-sm text-slate-400 mt-1.5">
              {sessionsLeft > 0 ? 'Ready when you are' : 'Top up to keep training'}
            </p>
          </div>
          <Link
            href={sessionsLeft > 0 ? '/client/book' : '/client/packages'}
            className="btn-primary !w-auto px-5 py-2.5 text-sm shrink-0"
          >
            {sessionsLeft > 0 ? 'Book now' : 'Buy sessions'}
          </Link>
        </div>
      </div>

      {/* Next session + this-month stat */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link
          href="/client/book"
          className="card-interactive animate-fade-in-up"
          style={{ animationDelay: '120ms' }}
        >
          <div className="flex items-center gap-1.5 text-slate-400 mb-2">
            <CalendarClock size={14} className="text-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wider">Next session</span>
          </div>
          {next ? (
            <>
              <p className="font-semibold text-slate-50 leading-tight">{next.dateStr}</p>
              <p className="text-sm text-slate-400">{next.timeStr}</p>
              <span className="mt-2 inline-block text-xs text-emerald-400 bg-emerald-900/40 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                {next.chip}
              </span>
            </>
          ) : (
            <>
              <p className="font-semibold text-slate-300 leading-tight">Nothing booked</p>
              <p className="text-sm text-slate-500">Tap to schedule</p>
            </>
          )}
        </Link>

        <div className="stat-card animate-fade-in-up" style={{ animationDelay: '160ms' }}>
          <CheckCircle2 size={18} className="mx-auto text-emerald-400 mb-1.5" />
          <p className="text-2xl font-bold glow-text tabular-nums">{completedThisMonth}</p>
          <p className="text-xs text-slate-400 mt-1">Done this month</p>
        </div>
      </div>

      {/* Quick actions */}
      <h2 className="section-label mb-3">Quick actions</h2>
      <div className="space-y-3">
        {QUICK_ACTIONS.map(({ href, label, desc, Icon }, i) => (
          <Link
            key={href}
            href={href}
            className="card-interactive flex items-center justify-between animate-fade-in-up"
            style={{ animationDelay: `${200 + i * 60}ms` }}
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
