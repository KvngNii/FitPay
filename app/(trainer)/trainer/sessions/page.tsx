import { createAdminSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function SessionsPage() {
  const admin = createAdminSupabaseClient()

  const now = new Date().toISOString()

  const [{ data: upcoming }, { data: recent }] = await Promise.all([
    admin
      .from('sessions')
      .select('id, scheduled_at, status, notes, users!client_id(name, phone)')
      .eq('status', 'scheduled')
      .gte('scheduled_at', now)
      .order('scheduled_at', { ascending: true })
      .limit(20),
    admin
      .from('sessions')
      .select('id, scheduled_at, status, notes, users!client_id(name, phone)')
      .eq('status', 'completed')
      .order('scheduled_at', { ascending: false })
      .limit(10),
  ])

  return (
    <main className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-emerald-400 mb-5">Sessions</h1>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Upcoming</h2>
        {upcoming && upcoming.length > 0 ? (
          <div className="space-y-2">
            {upcoming.map((s: any) => (
              <SessionRow key={s.id} session={s} />
            ))}
          </div>
        ) : (
          <div className="card text-center py-6">
            <p className="text-slate-400 text-sm">No upcoming sessions.</p>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Recent</h2>
        {recent && recent.length > 0 ? (
          <div className="space-y-2">
            {recent.map((s: any) => (
              <SessionRow key={s.id} session={s} />
            ))}
          </div>
        ) : (
          <div className="card text-center py-6">
            <p className="text-slate-400 text-sm">No completed sessions yet.</p>
          </div>
        )}
      </section>
    </main>
  )
}

function SessionRow({ session }: { session: any }) {
  const date = new Date(session.scheduled_at)
  const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="card flex items-center justify-between">
      <div>
        <p className="font-medium text-slate-50">{session.users?.name}</p>
        <p className="text-sm text-slate-400">{dateStr} · {timeStr}</p>
        {session.notes && <p className="text-xs text-slate-500 mt-1">{session.notes}</p>}
      </div>
      <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${
        session.status === 'completed'
          ? 'bg-emerald-900/40 text-emerald-400'
          : 'bg-blue-900/40 text-blue-400'
      }`}>
        {session.status}
      </span>
    </div>
  )
}
