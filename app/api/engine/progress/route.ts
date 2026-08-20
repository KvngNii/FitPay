import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { runProgressionEngine } from '@/lib/engine/progression'
import { rejectIfNotInternal } from '@/lib/internal'
import type { ProgressionRule, WorkoutLog } from '@/types'

// Runs the deterministic rules engine after a session is completed.
// Reads last workout_log and progression_rules for the client.
// Calls runProgressionEngine() from lib/engine/progression.ts.
// Writes next_plan back to workout_logs.next_plan.
// Updates progression_rules (sessions_in_phase, current_phase, last_updated).
// Claude is NEVER called here.
export async function POST(req: NextRequest) {
  const blocked = rejectIfNotInternal(req)
  if (blocked) return blocked

  const { session_id, client_id } = await req.json()
  if (!session_id || !client_id) {
    return NextResponse.json({ error: 'session_id and client_id are required' }, { status: 400 })
  }

  const admin = createAdminSupabaseClient()

  const [{ data: log }, { data: rules }] = await Promise.all([
    admin.from('workout_logs').select('*').eq('session_id', session_id).single(),
    admin.from('progression_rules').select('*').eq('client_id', client_id).single(),
  ])

  if (!log) return NextResponse.json({ error: 'Workout log not found' }, { status: 404 })
  if (!rules) return NextResponse.json({ error: 'Progression rules not found' }, { status: 404 })

  if (!log.exercises || log.exercises.length === 0) {
    return NextResponse.json({ success: true, skipped: 'no exercises logged' })
  }

  const { next_plan, updated_rules } = runProgressionEngine({
    client_id,
    last_workout_log: log as WorkoutLog,
    progression_rules: rules as ProgressionRule,
  })

  await Promise.all([
    admin.from('workout_logs').update({ next_plan }).eq('id', log.id),
    admin.from('progression_rules').update(updated_rules).eq('client_id', client_id),
  ])

  return NextResponse.json({ success: true, next_plan, updated_rules })
}
