import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CalendarDays } from 'lucide-react'
import ClientCalendar from './ClientCalendar'
import UpcomingSessionCard from '../book/UpcomingSessionCard'
import AddToCalendar from '@/components/AddToCalendar'
import type { ExerciseEntry } from '@/types'

export const dynamic = 'force-dynamic'

export default async function CalendarPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: activePurchases }, { data: upcoming }, { data: lastSession }] = await Promise.all([
    supabase
      .from('purchases')
      .select('sessions_left')
      .eq('client_id', user.id)
      .eq('status', 'active')
      .gt('sessions_left', 0),
    supabase
      .from('sessions')
      .select('id, scheduled_at, notes')
      .eq('client_id', user.id)
      .eq('status', 'scheduled')
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true }),
    supabase
      .from('sessions')
      .select('id')
      .eq('client_id', user.id)
      .eq('status', 'completed')
      .order('scheduled_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const sessionsLeft = (activePurchases ?? []).reduce((sum, p) => sum + (p.sessions_left ?? 0), 0)

  let nextPlan: ExerciseEntry[] | null = null
  if (lastSession) {
    const { data: log } = await supabase
      .from('workout_logs')
      .select('next_plan')
      .eq('session_id', lastSession.id)
      .maybeSingle()
    if (log?.next_plan) nextPlan = log.next_plan as ExerciseEntry[]
  }

  const next = upcoming?.[0] ?? null
  const laterUpcoming = (upcoming ?? []).slice(1)

  return (
    <main className="p-4 max-w-lg mx-auto">
      <h1 className="page-title mb-1 animate-fade-in-up">Calendar</h1>
      <p className="text-slate-400 text-sm mb-5">Pick a date and choose an open slot to book your session.</p>

      {/* Next session with live countdown + workout preview */}
      {next && (
        <section className="mb-6">
          <UpcomingSessionCard session={next} nextPlan={nextPlan} isNext />
        </section>
      )}

      {/* Booking calendar */}
      <section>
        <h2 className="section-label mb-3">
          <CalendarDays size={14} />
          Book a session
        </h2>
        <ClientCalendar sessionsLeft={sessionsLeft} />
      </section>

      {/* Remaining upcoming sessions */}
      {laterUpcoming.length > 0 && (
        <section className="mt-8">
          <h2 className="section-label mb-3">More upcoming</h2>
          <div className="space-y-2">
            {laterUpcoming.map((s) => {
              const date = new Date(s.scheduled_at)
              const dateStr = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Africa/Accra' })
              const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Accra' })
              return (
                <div key={s.id} className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-50">{dateStr}</p>
                      <p className="text-sm text-slate-400">{timeStr}</p>
                    </div>
                    <AddToCalendar sessionId={s.id} scheduledAt={s.scheduled_at} compact />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </main>
  )
}
