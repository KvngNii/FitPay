import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BookForm from './BookForm'
import UpcomingSessionCard from './UpcomingSessionCard'
import type { ExerciseEntry } from '@/types'

export const dynamic = 'force-dynamic'

export default async function BookPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: purchase }, { data: upcoming }, { data: lastSession }] = await Promise.all([
    supabase
      .from('purchases')
      .select('sessions_left')
      .eq('client_id', user.id)
      .eq('status', 'active')
      .gt('sessions_left', 0)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('sessions')
      .select('id, scheduled_at, notes')
      .eq('client_id', user.id)
      .eq('status', 'scheduled')
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

  let nextPlan: ExerciseEntry[] | null = null
  if (lastSession) {
    const { data: log } = await supabase
      .from('workout_logs')
      .select('next_plan')
      .eq('session_id', lastSession.id)
      .maybeSingle()
    if (log?.next_plan) {
      nextPlan = log.next_plan as ExerciseEntry[]
    }
  }

  return (
    <main className="p-4 max-w-lg mx-auto">
      <h1 className="page-title mb-1">Book a Session</h1>
      <p className="text-slate-400 text-sm mb-5">Schedule your next workout with your trainer.</p>

      <BookForm sessionsLeft={purchase?.sessions_left ?? 0} />

      {upcoming && upcoming.length > 0 && (
        <section className="mt-8">
          <h2 className="section-label mb-3">
            Upcoming Sessions
          </h2>
          <div className="space-y-3">
            {upcoming.map((s, i) => (
              <UpcomingSessionCard
                key={s.id}
                session={s}
                nextPlan={i === 0 ? nextPlan : null}
                isNext={i === 0}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
