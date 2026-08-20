import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server'
import { CalendarClock, History, Sun } from 'lucide-react'
import BookSessionForm from './BookSessionForm'
import { SessionCard } from './SessionActions'

export const dynamic = 'force-dynamic'

type ScheduledSession = {
  id: string
  scheduled_at: string
  status: string
  notes: string | null
  users: { name: string; phone?: string } | null
}

export default async function SessionsPage() {
  const auth = createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  const admin = createAdminSupabaseClient()

  const now = new Date()
  const nowIso = now.toISOString()
  const endOfToday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  ).toISOString()

  const [{ data: scheduled }, { data: recent }, { data: activePurchases }] = await Promise.all([
    admin
      .from('sessions')
      .select('id, scheduled_at, status, notes, users!client_id(name, phone)')
      .eq('status', 'scheduled')
      .eq('trainer_id', user!.id)
      .order('scheduled_at', { ascending: true })
      .limit(40),
    admin
      .from('sessions')
      .select('id, scheduled_at, status, notes, users!client_id(name)')
      .in('status', ['completed', 'cancelled', 'no_show'])
      .eq('trainer_id', user!.id)
      .order('scheduled_at', { ascending: false })
      .limit(15),
    admin
      .from('purchases')
      .select('client_id, sessions_left, packages(name), users!client_id(id, name)')
      .eq('status', 'active')
      .eq('trainer_id', user!.id)
      .gt('sessions_left', 0),
  ])

  // Split scheduled sessions into "today or earlier" vs "upcoming days".
  const scheduledList = (scheduled ?? []) as unknown as ScheduledSession[]
  const today = scheduledList.filter((s) => s.scheduled_at < endOfToday)
  const upcoming = scheduledList.filter((s) => s.scheduled_at >= endOfToday)

  // Build bookable clients list (deduplicated - keep highest sessions_left per client)
  const clientMap = new Map<string, { id: string; name: string; sessions_left: number; package_name: string }>()
  for (const p of activePurchases ?? []) {
    const client = p.users as unknown as { id: string; name: string } | null
    if (!client?.id) continue
    const existing = clientMap.get(client.id)
    if (!existing || p.sessions_left > existing.sessions_left) {
      clientMap.set(client.id, {
        id: client.id,
        name: client.name,
        sessions_left: p.sessions_left,
        package_name: (p.packages as unknown as { name: string } | null)?.name ?? '',
      })
    }
  }
  const bookableClients = Array.from(clientMap.values())

  const dueCount = today.filter((s) => s.scheduled_at <= nowIso).length

  return (
    <main className="p-4 max-w-2xl mx-auto">
      <h1 className="page-title mb-5 animate-fade-in-up">Sessions</h1>

      <BookSessionForm clients={bookableClients} />

      {/* Today */}
      <section className="mt-8 mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-label">
            <Sun size={14} />
            Today ({today.length})
          </h2>
          {dueCount > 0 && (
            <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full">
              {dueCount} ready to log
            </span>
          )}
        </div>
        {today.length > 0 ? (
          <div className="space-y-2">
            {today.map((s) => (
              <SessionCard
                key={s.id}
                session={s as unknown as Parameters<typeof SessionCard>[0]['session']}
                isDue={s.scheduled_at <= nowIso}
              />
            ))}
          </div>
        ) : (
          <div className="card text-center py-6">
            <Sun size={24} className="mx-auto text-slate-600 mb-2" />
            <p className="text-slate-400 text-sm">Nothing scheduled for today.</p>
          </div>
        )}
      </section>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section className="mb-8">
          <h2 className="section-label mb-3">
            <CalendarClock size={14} />
            Upcoming ({upcoming.length})
          </h2>
          <div className="space-y-2">
            {upcoming.map((s) => (
              <SessionCard
                key={s.id}
                session={s as unknown as Parameters<typeof SessionCard>[0]['session']}
              />
            ))}
          </div>
        </section>
      )}

      {/* Recent */}
      {recent && recent.length > 0 && (
        <section>
          <h2 className="section-label mb-3">
            <History size={14} />
            Recent
          </h2>
          <div className="space-y-2">
            {recent.map((s) => {
              const date = new Date(s.scheduled_at)
              const dateStr = date.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                timeZone: 'Africa/Accra',
              })
              return (
                <div key={s.id} className="card flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-50">{(s.users as unknown as { name: string } | null)?.name}</p>
                    <p className="text-sm text-slate-400">{dateStr}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full border ${
                    s.status === 'completed' ? 'bg-emerald-900/40 text-emerald-400 border-emerald-500/20' :
                    s.status === 'cancelled' ? 'bg-red-900/40 text-red-400 border-red-500/20' :
                    'bg-slate-800 text-slate-400 border-slate-700'
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
