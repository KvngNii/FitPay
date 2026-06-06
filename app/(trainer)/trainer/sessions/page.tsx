import { createAdminSupabaseClient } from '@/lib/supabase/server'
import BookSessionForm from './BookSessionForm'
import { SessionCard } from './SessionActions'

export const dynamic = 'force-dynamic'

export default async function SessionsPage() {
  const admin = createAdminSupabaseClient()
  const now = new Date().toISOString()

  const [{ data: upcoming }, { data: recent }, { data: activePurchases }] = await Promise.all([
    admin
      .from('sessions')
      .select('id, scheduled_at, status, notes, users!client_id(name, phone)')
      .eq('status', 'scheduled')
      .gte('scheduled_at', now)
      .order('scheduled_at', { ascending: true })
      .limit(20),
    admin
      .from('sessions')
      .select('id, scheduled_at, status, notes, users!client_id(name)')
      .in('status', ['completed', 'cancelled', 'no_show'])
      .order('scheduled_at', { ascending: false })
      .limit(15),
    admin
      .from('purchases')
      .select('client_id, sessions_left, packages(name), users!client_id(id, name)')
      .eq('status', 'active')
      .gt('sessions_left', 0),
  ])

  // Build bookable clients list (deduplicated — keep highest sessions_left per client)
  const clientMap = new Map<string, { id: string; name: string; sessions_left: number; package_name: string }>()
  for (const p of activePurchases ?? []) {
    const client = p.users as any
    const existing = clientMap.get(client?.id)
    if (!existing || p.sessions_left > existing.sessions_left) {
      clientMap.set(client?.id, {
        id: client?.id,
        name: client?.name,
        sessions_left: p.sessions_left,
        package_name: (p.packages as any)?.name ?? '',
      })
    }
  }
  const bookableClients = Array.from(clientMap.values())

  return (
    <main className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-emerald-400 mb-5">Sessions</h1>

      <BookSessionForm clients={bookableClients} />

      {/* Upcoming */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Upcoming ({upcoming?.length ?? 0})
        </h2>
        {upcoming && upcoming.length > 0 ? (
          <div className="space-y-2">
            {upcoming.map((s: any) => <SessionCard key={s.id} session={s} />)}
          </div>
        ) : (
          <div className="card text-center py-6">
            <p className="text-slate-400 text-sm">No upcoming sessions.</p>
          </div>
        )}
      </section>

      {/* Recent */}
      {recent && recent.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Recent</h2>
          <div className="space-y-2">
            {recent.map((s: any) => {
              const date = new Date(s.scheduled_at)
              const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
              return (
                <div key={s.id} className="card flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-50">{s.users?.name}</p>
                    <p className="text-sm text-slate-400">{dateStr}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    s.status === 'completed' ? 'bg-emerald-900/40 text-emerald-400' :
                    s.status === 'cancelled' ? 'bg-red-900/40 text-red-400' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {s.status}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </main>
  )
}
