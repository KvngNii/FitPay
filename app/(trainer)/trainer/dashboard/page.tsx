import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Users, CalendarCheck, TrendingUp, PackageOpen } from 'lucide-react'
import SignOutButton from './SignOutButton'

export const dynamic = 'force-dynamic'

export default async function TrainerDashboard() {
  const auth = createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()

  const admin = createAdminSupabaseClient()

  const [
    { count: activeClients },
    { count: upcomingSessions },
    { count: completedThisMonth },
    { data: recentPurchases },
  ] = await Promise.all([
    admin
      .from('purchases')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),
    admin
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'scheduled')
      .gte('scheduled_at', new Date().toISOString()),
    admin
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('scheduled_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    admin
      .from('purchases')
      .select('id, status, sessions_left, created_at, users!client_id(name), packages(name, price_ghs)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const { data: trainer } = await admin
    .from('users')
    .select('name')
    .eq('id', user!.id)
    .single()

  const stats = [
    { label: 'Active clients', value: activeClients ?? 0, Icon: Users },
    { label: 'Upcoming', value: upcomingSessions ?? 0, Icon: CalendarCheck },
    { label: 'Done this month', value: completedThisMonth ?? 0, Icon: TrendingUp },
  ]

  return (
    <main className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold glow-text">Dashboard</h1>
          <p className="text-sm text-slate-400">Welcome back, {trainer?.name?.split(' ')[0]}</p>
        </div>
        <SignOutButton />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="stat-card animate-scale-in"
            style={{ animationDelay: `${i * 75}ms` }}
          >
            <s.Icon size={18} className="mx-auto text-emerald-400 mb-1.5" />
            <p className="text-2xl font-bold glow-text">{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recent purchases */}
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Recent Purchases</h2>
      {recentPurchases && recentPurchases.length > 0 ? (
        <div className="space-y-2">
          {recentPurchases.map((p, i) => (
            <div
              key={p.id}
              className="card flex items-center justify-between animate-fade-in-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div>
                <p className="font-medium text-slate-50">{(p.users as unknown as { name: string } | null)?.name}</p>
                <p className="text-sm text-slate-400">{(p.packages as unknown as { name: string } | null)?.name}</p>
                <p className="text-xs text-slate-500">{p.sessions_left} sessions left</p>
              </div>
              <span className="badge-active">Active</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-8">
          <PackageOpen size={28} className="mx-auto text-slate-600 mb-2" />
          <p className="text-slate-400 text-sm">No active packages yet.</p>
        </div>
      )}
    </main>
  )
}
