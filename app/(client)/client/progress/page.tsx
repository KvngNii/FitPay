import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Difficulty } from '@/types'

export const dynamic = 'force-dynamic'

const DIFFICULTY_COLOURS: Record<string, string> = {
  easy: 'bg-emerald-900/40 text-emerald-400',
  moderate: 'bg-yellow-900/40 text-yellow-400',
  hard: 'bg-red-900/40 text-red-400',
}

export default async function ProgressPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: rule }, { data: completedSessions }] = await Promise.all([
    supabase
      .from('progression_rules')
      .select('current_phase, sessions_in_phase, deload_every_n, goal')
      .eq('client_id', user.id)
      .maybeSingle(),
    supabase
      .from('sessions')
      .select('id, scheduled_at, workout_logs(overall_difficulty, exercises, injury_flag)')
      .eq('client_id', user.id)
      .eq('status', 'completed')
      .order('scheduled_at', { ascending: false })
      .limit(10),
  ])

  const history = (completedSessions ?? []).map((s) => {
    const log = s.workout_logs as unknown as
      | { overall_difficulty: Difficulty; exercises: { name: string }[]; injury_flag: boolean }
      | null
    return { id: s.id, scheduled_at: s.scheduled_at, log }
  })

  const totalCompleted = history.length

  const goalLabels: Record<string, string> = {
    weight_loss: 'Weight Loss',
    strength: 'Building Strength',
    endurance: 'Improving Endurance',
    general: 'General Fitness',
  }

  return (
    <main className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-emerald-400 mb-5">My Progress</h1>

      {rule ? (
        <div className="card mb-6">
          <p className="text-sm text-slate-400">Goal</p>
          <p className="text-lg font-semibold text-slate-50 mb-3">{goalLabels[rule.goal] ?? rule.goal}</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-400">Current Phase</p>
              <p className="font-medium text-slate-50 capitalize">{rule.current_phase ?? '—'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Sessions in Phase</p>
              <p className="font-medium text-slate-50">{rule.sessions_in_phase} / {rule.deload_every_n}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="card mb-6 text-center py-6">
          <p className="text-slate-400 text-sm">Your progress will appear here once your trainer sets up your plan.</p>
        </div>
      )}

      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Workout History ({totalCompleted})
      </h2>

      {history.length > 0 ? (
        <div className="space-y-2">
          {history.map(({ id, scheduled_at, log }) => {
            const date = new Date(scheduled_at)
            const dateStr = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
            return (
              <div key={id} className="card">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-50">{dateStr}</p>
                    <p className="text-sm text-slate-400 truncate">
                      {log ? `${log.exercises?.length ?? 0} exercises` : 'No log recorded'}
                      {log?.injury_flag ? ' · Injury reported' : ''}
                    </p>
                  </div>
                  {log && (
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize shrink-0 ${DIFFICULTY_COLOURS[log.overall_difficulty] ?? 'bg-slate-800 text-slate-400'}`}>
                      {log.overall_difficulty}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card text-center py-8">
          <p className="text-slate-400 text-sm">No completed sessions yet.</p>
        </div>
      )}
    </main>
  )
}
