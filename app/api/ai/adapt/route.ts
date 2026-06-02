import { NextResponse } from 'next/server'

// Claude trigger 3 of 4: injury adaptation.
// Fires when injury_flag = true on a workout_log.
// Prompt includes: injury_notes, last 3 workout_logs, current progression_rules.
// Calls Claude with max_tokens: 800.
// Output: modified next 2-session plan avoiding the injured area as ExerciseEntry[].
// Replaces the rules-engine-generated next_plan for the next 2 sessions.
// If Claude is unavailable, queue the task and flag for trainer to review manually.
export async function POST() {
  return NextResponse.json({ status: 'ok', message: 'not implemented' })
}
