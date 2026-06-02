import { NextResponse } from 'next/server'

// Runs the deterministic rules engine after a session is completed.
// Reads last workout_log and progression_rules for the client.
// Calls runProgressionEngine() from lib/engine/progression.ts.
// Writes next_plan back to workout_logs.next_plan.
// Updates progression_rules (sessions_in_phase, current_phase, last_updated).
// Claude is NEVER called here.
export async function POST() {
  return NextResponse.json({ status: 'ok', message: 'not implemented' })
}
