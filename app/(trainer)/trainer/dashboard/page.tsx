import Link from 'next/link'
import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server'
import {
  Users,
  CalendarCheck,
  Wallet,
  Clock,
  RotateCcw,
  ChevronRight,
  ClipboardList,
  CalendarDays,
  ArrowUpRight,
} from 'lucide-react'
import SignOutButton from './SignOutButton'
import DeleteAccountButton from '@/components/DeleteAccountButton'

export const dynamic = 'force-dynamic'

// Ghana is UTC+0 (no DST) — using UTC boundaries is correct for Accra.
const TZ = 'Africa/Accra'

function ghs(n: number) {
  return n.toLocaleString('en-GH', { maximumFractionDigits: n % 1 === 0 ? 0 : 2 })
}

const QUICK_ACTIONS = [
  { href: '/trainer/clients', label: 'Clients', desc: 'Roster and medical history', Icon: Users },
  { href: '/trainer/sessions', label: 'Sessions', desc: 'Book and manage', Icon: CalendarDays },
  { href: '/trainer/log', label: 'Log a workout', desc: 'Record a completed session', Icon: ClipboardList },
  { href: '/trainer/earnings', label: 'Earnings', desc: 'Withdraw and refunds', Icon: Wallet },
]

export default async function TrainerDashboard() {
  const auth = createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()

  const admin = createAdminSupabaseClient()

  const now = new Date()
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString()
  const endOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)).toISOString()

  const [
    { data: profile },
    { data: purchases },
    { data: disbursements },
    { data: todaySessions },
    { count: pendingRefunds },
    { count: completedThisMonth },
  ] = await Promise.all([
    admin.from('users').select('name').eq('id', user!.id).single(),
    admin
      .from('purchases')
      .select('id, status, created_at, client_id, packages(price_ghs)')
      .in('status', ['active', 'expired']),
    admin
      .from('disbursements')
      .select('amount_ghs, type, status')
      .eq('trainer_id', user!.id),
    admin
      .from('sessions')
      .select('id, scheduled_at, users!client_id(name)')
      .eq('trainer_id', user!.id)
      .eq('status', 'scheduled')
      .gte('scheduled_at', startOfToday)
      .lt('scheduled_at', endOfToday)
      .order('scheduled_at', { ascending: true }),
    admin
      .from('refund_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    admin
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('trainer_id', user!.id)
      .eq('status', 'completed')
      .gte('scheduled_at', monthStart),
  ])

  const priceOf = (p: { packages: unknown }) =>
    Number((p.packages as { price_ghs: number } | null)?.price_ghs ?? 0)

  const allPurchases = purchases ?? []
  const totalRevenue = allPurchases.reduce((sum, p) => sum + priceOf(p), 0)
  const thisMonthRevenue = allPurchases
    .filter((p) => p.created_at >= monthStart)
    .reduce((sum, p) => sum + priceOf(p), 0)

  const totalWithdrawn = (disbursements ?? [])
    .filter((d) => d.status === 'success' && d.type === 'withdrawal')
    .reduce((sum, d) => sum + Number(d.amount_ghs), 0)

  const available = totalRevenue - totalWithdrawn

  // Distinct clients with at least one active package (fixes the double-count).
  const activeClients = new Set(
    allPurchases.filter((p) => p.status === 'active').map((p) => p.client_id)
  ).size

  const today = todaySessions ?? []
  const firstName = profile?.name?.split(' ')[0] ?? 'there'

  const stats = [
    { label: 'Active clients', value: activeClients, Icon: Users },
    { label: 'Today', value: today.length, Icon: Clock },
    { label: 'Done this month', value: completedThisMonth ?? 0, Icon: CalendarCheck },
  ]

  return (
    <main className="p-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-fade-in-up">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-0.5">Welcome back, {firstName}</p>
        </div>
        <SignOutButton />
      </div>

      {/* Attention: pending refund requests */}
      {(pendingRefunds ?? 0) > 0 && (
        <Link
          href="/trainer/earnings"
          className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/[0.08] p-4 mb-4 hover:bg-amber-500/[0.12] transition-colors animate-fade-in-up"
        >
          <div className="flex items-center gap-3">
            <div className="shrink-0 w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
              <RotateCcw size={16} className="text-amber-400" />
            </div>
            <div>
              <p className="font-semibold text-amber-300 text-sm">
                {pendingRefunds} refund request{pendingRefunds !== 1 ? 's' : ''} awaiting review
              </p>
              <p className="text-xs text-amber-400/70">Tap to approve or reject</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-amber-400/70" />
        </Link>
      )}

      {/* Money hero */}
      <Link
        href="/trainer/earnings"
        className="relative block overflow-hidden rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/[0.12] via-slate-900 to-slate-900 p-5 mb-4 hover:border-emerald-500/40 transition-colors animate-fade-in-up"
        style={{ animationDelay: '60ms' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 60% at 85% 0%, rgba(224, 123, 31,0.14), transparent)' }}
        />
        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-emerald-400 mb-1">
              <Wallet size={14} />
              <span className="text-xs font-semibold uppercase tracking-wider">Available to withdraw</span>
            </div>
            <p className="text-4xl font-bold glow-text leading-none tabular-nums">GH₵{ghs(available)}</p>
            <p className="text-sm text-slate-400 mt-2">
              <span className="text-emerald-400 font-medium">+GH₵{ghs(thisMonthRevenue)}</span> earned this month
            </p>
          </div>
          <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-900/40 border border-emerald-500/20 px-2.5 py-1 rounded-full shrink-0">
            Withdraw <ArrowUpRight size={12} />
          </span>
        </div>
      </Link>

      {/* Stat row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {stats.map((s, i) => (
          <div key={s.label} className="stat-card animate-scale-in" style={{ animationDelay: `${120 + i * 75}ms` }}>
            <s.Icon size={18} className="mx-auto text-emerald-400 mb-1.5" />
            <p className="text-2xl font-bold glow-text tabular-nums">{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Today's schedule */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="section-label">Today&apos;s schedule</h2>
        <Link href="/trainer/sessions" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
          View all
        </Link>
      </div>
      {today.length > 0 ? (
        <div className="space-y-2 mb-6">
          {today.map((s) => {
            const time = new Date(s.scheduled_at).toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: TZ,
            })
            const name = (s.users as unknown as { name: string } | null)?.name ?? 'Client'
            return (
              <div key={s.id} className="card flex items-center gap-3">
                <div className="shrink-0 w-14 text-center">
                  <p className="text-sm font-bold text-emerald-400 tabular-nums leading-tight">{time}</p>
                </div>
                <div className="w-px h-8 bg-slate-700/70" />
                <p className="font-medium text-slate-50">{name}</p>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card text-center py-6 mb-6">
          <CalendarCheck size={24} className="mx-auto text-slate-600 mb-2" />
          <p className="text-slate-400 text-sm">No sessions scheduled today.</p>
          <Link href="/trainer/sessions" className="text-xs text-emerald-400 hover:text-emerald-300 mt-1 inline-block">
            Book a session
          </Link>
        </div>
      )}

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

      <DeleteAccountButton />
    </main>
  )
}
