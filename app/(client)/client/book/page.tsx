import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BookForm from './BookForm'

export const dynamic = 'force-dynamic'

export default async function BookPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: purchase } = await supabase
    .from('purchases')
    .select('sessions_left')
    .eq('client_id', user.id)
    .eq('status', 'active')
    .gt('sessions_left', 0)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  const { data: upcoming } = await supabase
    .from('sessions')
    .select('id, scheduled_at, notes')
    .eq('client_id', user.id)
    .eq('status', 'scheduled')
    .order('scheduled_at', { ascending: true })

  return (
    <main className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-emerald-400 mb-1">Book a Session</h1>
      <p className="text-slate-400 text-sm mb-5">Schedule your next workout with your trainer.</p>

      <BookForm sessionsLeft={purchase?.sessions_left ?? 0} />

      {upcoming && upcoming.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Your Upcoming Sessions
          </h2>
          <div className="space-y-2">
            {upcoming.map((s) => {
              const date = new Date(s.scheduled_at)
              const dateStr = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
              const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
              return (
                <div key={s.id} className="card">
                  <p className="font-medium text-slate-50">{dateStr} at {timeStr}</p>
                  {s.notes && <p className="text-sm text-slate-400 mt-0.5">{s.notes}</p>}
                </div>
              )
            })}
          </div>
        </section>
      )}
    </main>
  )
}
