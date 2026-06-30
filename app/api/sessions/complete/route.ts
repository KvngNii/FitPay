import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const auth = createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminSupabaseClient()
  const { data: profile } = await admin.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'trainer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { session_id, exercises, overall_difficulty, injury_flag, injury_notes } = await req.json()
  if (!session_id || !overall_difficulty) {
    return NextResponse.json({ error: 'session_id and overall_difficulty are required' }, { status: 400 })
  }

  const { data: session } = await admin
    .from('sessions')
    .select('id, status, client_id, purchase_id')
    .eq('id', session_id)
    .single()

  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  if (session.status !== 'scheduled') {
    return NextResponse.json({ error: 'Session is not scheduled' }, { status: 400 })
  }

  // Mark session complete
  await admin.from('sessions').update({ status: 'completed' }).eq('id', session_id)

  // Insert workout log
  const { error: logError } = await admin.from('workout_logs').insert({
    session_id,
    exercises: exercises ?? [],
    overall_difficulty,
    injury_flag: injury_flag ?? false,
    injury_notes: injury_notes ?? null,
    ai_generated: false,
  })

  if (logError) {
    console.error('Workout log insert error:', logError)
  }

  // Update progression rule for this client
  const { data: rule } = await admin
    .from('progression_rules')
    .select('id, sessions_in_phase')
    .eq('client_id', session.client_id)
    .single()

  const newSessionsInPhase = (rule?.sessions_in_phase ?? 0) + 1

  if (rule) {
    await admin
      .from('progression_rules')
      .update({ sessions_in_phase: newSessionsInPhase, last_updated: new Date().toISOString() })
      .eq('id', rule.id)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  // Injury sessions get an AI safety-adapted plan; otherwise the deterministic
  // progression engine advances next_plan (both non-blocking)
  if (injury_flag) {
    fetch(`${appUrl}/api/ai/adapt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id, client_id: session.client_id, injury_notes }),
    }).catch(() => {})
  } else {
    fetch(`${appUrl}/api/engine/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id, client_id: session.client_id }),
    }).catch(() => {})
  }

  // AI trigger: every 4th session report (non-blocking)
  if (newSessionsInPhase % 4 === 0) {
    fetch(`${appUrl}/api/ai/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id, client_id: session.client_id }),
    }).catch(() => {})
  }

  return NextResponse.json({ success: true })
}
