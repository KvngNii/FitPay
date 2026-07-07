import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { ExerciseEntry } from '@/types'

export const dynamic = 'force-dynamic'

function DifficultyBadge({ d }: { d: string }) {
  const colours: Record<string, string> = {
    easy: 'bg-emerald-900/40 text-emerald-400',
    moderate: 'bg-yellow-900/40 text-yellow-400',
    hard: 'bg-red-900/40 text-red-400',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${colours[d] ?? 'bg-slate-800 text-slate-400'}`}>
      {d}
    </span>
  )
}

function ExerciseList({ exercises, label }: { exercises: ExerciseEntry[]; label: string }) {
  return (
    <section className="mb-6">
      <h2 className="section-label mb-3">{label}</h2>
      <div className="space-y-2">
        {exercises.map((ex, i) => (
          <div key={i} className="card">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-slate-50 truncate">{ex.name}</p>
                <p className="text-sm text-slate-400 mt-0.5">
                  {ex.sets} sets × {ex.reps} reps
                  {ex.weight_kg > 0 ? ` · ${ex.weight_kg} kg` : ' · bodyweight'}
                </p>
                {ex.notes && <p className="text-xs text-slate-500 mt-1">{ex.notes}</p>}
              </div>
              <DifficultyBadge d={ex.difficulty} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default async function PlanPage() {
  const auth = createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminSupabaseClient()

  const { data: rule } = await admin
    .from('progression_rules')
    .select('initial_plan, sessions_in_phase')
    .eq('client_id', user.id)
    .single()

  // Look for the most recent next_plan - from injury adaptation or routine progression
  const { data: latestLog } = await admin
    .from('workout_logs')
    .select('next_plan, ai_generated, created_at')
    .in(
      'session_id',
      (
        await admin
          .from('sessions')
          .select('id')
          .eq('client_id', user.id)
          .eq('status', 'completed')
          .order('scheduled_at', { ascending: false })
          .limit(5)
      ).data?.map((s) => s.id) ?? []
    )
    .not('next_plan', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const latestPlan = latestLog?.next_plan as ExerciseEntry[] | null
  const isAdapted = latestLog?.ai_generated === true
  const initialPlan = rule?.initial_plan as ExerciseEntry[] | null

  const hasPlan = latestPlan || initialPlan

  return (
    <main className="p-4 max-w-lg mx-auto">
      <div className="mb-5">
        <h1 className="page-title">My Plan</h1>
        {rule && (
          <p className="text-sm text-slate-400 mt-1">
            {rule.sessions_in_phase} session{rule.sessions_in_phase !== 1 ? 's' : ''} completed
          </p>
        )}
      </div>

      {!hasPlan && (
        <div className="card text-center py-8">
          <p className="text-slate-400 text-sm">Your personalised plan will appear here after your trainer reviews your profile.</p>
        </div>
      )}

      {isAdapted && latestPlan && latestPlan.length > 0 && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-yellow-900/20 border border-yellow-800/40">
          <p className="text-xs text-yellow-400 font-medium">Adapted for your injury to keep you safe</p>
        </div>
      )}

      {latestPlan && latestPlan.length > 0 ? (
        <ExerciseList exercises={latestPlan} label={isAdapted ? 'Next Session (Adapted)' : 'Next Session'} />
      ) : (
        initialPlan && initialPlan.length > 0 && (
          <ExerciseList exercises={initialPlan} label="Your Starter Plan" />
        )
      )}
    </main>
  )
}
