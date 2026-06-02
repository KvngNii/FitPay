import { NextResponse } from 'next/server'

// Claude trigger 2 of 4: every-4th-session progress report.
// Fires when sessions_in_phase hits a multiple of 4.
// Prompt includes: last 4 workout_logs (full exercise data), client goal, progression_rules.
// Calls Claude with max_tokens: 500.
// Output: narrative paragraph — what improved, what to focus on. Not a plan.
// Delivers report to client via Moolre WhatsApp API.
// If Claude is unavailable, queue the task — do not break session completion flow.
export async function POST() {
  return NextResponse.json({ status: 'ok', message: 'not implemented' })
}
