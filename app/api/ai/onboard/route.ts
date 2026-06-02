import { NextResponse } from 'next/server'

// Claude trigger 1 of 4: new client onboarding.
// Fires once when a new client completes signup.
// Prompt includes: goal, fitness_level, any injuries, available days per week.
// Calls Claude with max_tokens: 800.
// Output: initial 4-session plan as structured ExerciseEntry[] JSON.
// Stores result in workout_logs or a dedicated onboarding_plan table.
// If Claude is unavailable, queue the task — do not break signup flow.
export async function POST() {
  return NextResponse.json({ status: 'ok', message: 'not implemented' })
}
