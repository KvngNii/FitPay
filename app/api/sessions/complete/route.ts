import { NextRequest, NextResponse } from 'next/server'

// Marks a session as completed and logs the workout.
// Trainer-only.
// Accepts: session_id, exercises (ExerciseEntry[]), overall_difficulty, injury_flag, injury_notes.
// Inserts workout_log row.
// Triggers /api/engine/progress to generate next_plan via rules engine.
// If injury_flag = true, triggers /api/ai/adapt.
// If sessions_in_phase hits multiple of 4, triggers /api/ai/report.
export async function POST(_req: NextRequest) {
  return NextResponse.json({ status: 'ok', message: 'not implemented' })
}
