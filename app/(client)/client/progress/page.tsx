import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Target, CalendarCheck, Flame, Activity } from 'lucide-react'
import type { Difficulty } from '@/types'

export const dynamic = 'force-dynamic'

const DIFFICULTY_COLOURS: Record<string, string> = {
  easy: 'bg-emerald-900/40 text-emerald-400 border-emerald-500/20',
  moderate: 'bg-yellow-900/40 text-yellow-400 border-yellow-500/20',
  hard: 'bg-red-900/40 text-red-400 border-red-500/20',
}

export default async function ProgressPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  const [
    { data: rule },
    { data: completedSessions },
    { count: totalCompleted },
    { count: doneThisMonth },
  ] = await Promise.all([
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
    supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', user.id)
      .eq('status', 'completed'),
    supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', user.id)
      .eq('status', 'completed')
      .gte('scheduled_at', monthStart),
  ])

  const history = (completedSessions ?? []).map((s) => {
    const log = s.workout_logs as unknown as
      | { overall_difficulty: Difficulty; exercises: { name: string }[]; injury_flag: boolean }
      | null
    return { id: s.id, scheduled_at: s.scheduled_at, log }
  })

  const goalLabels: Record<string, string> = {
    weight_loss: 'Weight Loss',
    strength: 'Building Strength',
    endurance: 'Improving Endurance',
    general: 'General Fitness',
  }

  const phaseNow = rule?.sessions_in_phase ?? 0
  const phaseTarget = rule?.deload_every_n ?? 0
  const phasePct = phaseTarget > 0 ? Math.min(100, Math.round((phaseNow / phaseTarget) * 100)) : 0

  const stats = [
    { label: 'Total workouts', value: totalCompleted ?? 0, Icon: Activity },
    { label: 'This month', value: doneThisMonth ?? 0, Icon: CalendarCheck },
    { label: 'To deload', value: Math.max(0, phaseTarget - phaseNow), Icon: Flame },
  ]

  return (
    <main className="p-4 max-w-lg mx-auto">
      <h1 className="page-title mb-5 animate-fade-in-up">My Progress</h1>

      {/* At-a-glance stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {stats.map((s, i) => (
          <div key={s.label} className="stat-card animate-scale-in" style={{ animationDelay: `${i * 75}ms` }}>
            <s.Icon size={16} className="mx-auto text-emerald-400 mb-1.5" />
            <p className="text-2xl font-bold glow-text tabular-nums">{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Goal + phase progress */}
      {rule ? (
        <div className="card mb-6 animate-fade-in-up" style={{ animationDelay: '120ms' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-emerald-400" />
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Goal</p>
                <p className="font-semibold text-slate-50">{goalLabels[rule.goal] ?? rule.goal}</p>
              </div>
            </div>
            {rule.current_phase && (
              <span className="text-xs text-emerald-400 bg-emerald-900/40 border border-emerald-500/20 px-2.5 py-1 rounded-full capitalize">
                {rule.current_phase}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-slate-400">Phase progress</span>
            <span className="text-slate-300 tabular-nums">{phaseNow} / {phaseTarget} sessions</span>
          </div>
          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
              style={{ width: `${phasePct}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {phaseTarget - phaseNow > 0
              ? `${phaseTarget - phaseNow} session${phaseTarget - phaseNow !== 1 ? 's' : ''} until your next deload week`
              : 'Deload week is up next, with lighter loads to recover'}
          </p>
        </div>
      ) : (
        <div className="card mb-6 text-center py-6">
          <p className="text-slate-400 text-sm">Your progress will appear here once your trainer sets up your plan.</p>
        </div>
      )}

      <h2 className="section-label mb-3">Recent workouts</h2>

      {history.length > 0 ? (
        <div className="space-y-2">
          {history.map(({ id, scheduled_at, log }) => {
            const date = new Date(scheduled_at)
            const dateStr = date.toLocaleDateString('en-GB', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              timeZone: 'Africa/Accra',
            })
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
                    <span className={`text-xs px-2 py-0.5 rounded-full border capitalize shrink-0 ${DIFFICULTY_COLOURS[log.overall_difficulty] ?? 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                      {log.overall_difficulty}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
          {(totalCompleted ?? 0) > history.length && (
            <p className="text-center text-xs text-slate-500 pt-1">
              Showing your {history.length} most recent of {totalCompleted} workouts
            </p>
          )}
        </div>
      ) : (
        <div className="card text-center py-8">
          <Activity size={26} className="mx-auto text-slate-600 mb-2" />
          <p className="text-slate-400 text-sm">No completed sessions yet.</p>
          <p className="text-slate-500 text-xs mt-1">Your workout history will build here after each session.</p>
        </div>
      )}
    </main>
  )
}
