import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server'
import { LogSessionCard } from './LogSessionCard'
import type { ExerciseEntry } from '@/types'

export const dynamic = 'force-dynamic'

export default async function LogPage() {
  const auth = createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  const admin = createAdminSupabaseClient()
  const now = new Date().toISOString()

  const { data: sessions } = await admin
    .from('sessions')
    .select('id, client_id, scheduled_at, notes, users!client_id(name)')
    .eq('status', 'scheduled')
    .eq('trainer_id', user!.id)
    .lte('scheduled_at', now)
    .order('scheduled_at', { ascending: false })
    .limit(20)

  const clientIds = Array.from(new Set((sessions ?? []).map((s) => s.client_id)))

  const seedMap = new Map<string, ExerciseEntry[]>()
  await Promise.all(
    clientIds.map(async (clientId) => {
      const [{ data: lastLog }, { data: rule }] = await Promise.all([
        admin
          .from('workout_logs')
          .select('next_plan, created_at, sessions!inner(client_id)')
          .eq('sessions.client_id', clientId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        admin
          .from('progression_rules')
          .select('initial_plan')
          .eq('client_id', clientId)
          .maybeSingle(),
      ])

      const seed = (lastLog?.next_plan as ExerciseEntry[] | null)
        ?? (rule?.initial_plan as ExerciseEntry[] | null)
        ?? []
      seedMap.set(clientId, seed)
    })
  )

  const sessionsToLog = (sessions ?? []).map((s) => ({
    id: s.id as string,
    scheduled_at: s.scheduled_at as string,
    notes: s.notes as string | null,
    client_name: (s.users as unknown as { name: string } | null)?.name ?? 'Client',
    seedExercises: seedMap.get(s.client_id as string) ?? [],
  }))

  return (
    <main className="p-4 max-w-2xl mx-auto pb-10">
      <h1 className="text-2xl font-bold text-emerald-400 mb-1">Log Session</h1>
      <p className="text-slate-400 text-sm mb-5">
        Record what happened in each session. This updates the client&apos;s progress and feeds their next workout plan.
      </p>

      {sessionsToLog.length > 0 ? (
        <div className="space-y-3">
          {sessionsToLog.map((session) => (
            <LogSessionCard key={session.id} session={session} />
          ))}
        </div>
      ) : (
        <div className="card text-center py-6">
          <p className="text-slate-400 text-sm">
            No sessions awaiting a log. Sessions appear here once their scheduled time has passed.
          </p>
        </div>
      )}
    </main>
  )
}
