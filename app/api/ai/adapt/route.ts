import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { callClaude } from '@/lib/ai/claude'
import { rejectIfNotInternal } from '@/lib/internal'
import type { ExerciseEntry } from '@/types'

export async function POST(req: NextRequest) {
  const blocked = rejectIfNotInternal(req)
  if (blocked) return blocked

  const { session_id } = await req.json()
  if (!session_id) return NextResponse.json({ error: 'session_id required' }, { status: 400 })

  const admin = createAdminSupabaseClient()

  const { data: session } = await admin
    .from('sessions')
    .select('id, client_id, workout_logs(id, injury_notes, exercises)')
    .eq('id', session_id)
    .single()

  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  const log = session.workout_logs as unknown as { id: string; injury_notes: string | null; exercises: ExerciseEntry[] } | null
  if (!log) return NextResponse.json({ error: 'No workout log for this session' }, { status: 404 })

  const [{ data: client }, { data: recentSessions }] = await Promise.all([
    admin.from('users').select('name, goal, fitness_level').eq('id', session.client_id).single(),
    admin
      .from('sessions')
      .select('id')
      .eq('client_id', session.client_id)
      .eq('status', 'completed')
      .neq('id', session_id)
      .order('scheduled_at', { ascending: false })
      .limit(3),
  ])

  let recentExercises = ''
  if (recentSessions && recentSessions.length > 0) {
    const { data: recentLogs } = await admin
      .from('workout_logs')
      .select('exercises, overall_difficulty')
      .in('session_id', recentSessions.map((s) => s.id))

    recentExercises = (recentLogs ?? [])
      .flatMap((l) => ((l.exercises ?? []) as ExerciseEntry[]).map((e) => e.name))
      .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i)
      .slice(0, 10)
      .join(', ')
  }

  const goalLabels: Record<string, string> = {
    weight_loss: 'weight loss',
    strength: 'building strength',
    endurance: 'improving endurance',
    general: 'general fitness',
  }

  const prompt = `You are a personal trainer creating an injury-adapted workout plan.

Client: ${client?.name ?? 'Client'}
Goal: ${goalLabels[client?.goal ?? 'general'] ?? 'general fitness'}
Fitness level: ${client?.fitness_level ?? 'beginner'}
Injury reported: ${log.injury_notes ?? 'unspecified injury'}
Recent exercises: ${recentExercises || 'none recorded'}

Create a safe 5-exercise plan for their NEXT session that avoids stressing the injured area. Output ONLY a JSON array. Each exercise must follow this exact shape:
{"name": string, "sets": number, "reps": number, "weight_kg": number, "difficulty": "moderate", "notes": string}

Use weight_kg of 0 for bodyweight exercises. Include a brief note on each exercise explaining why it is safe given the injury. Return ONLY the JSON array, no other text.`

  let adaptedPlan = null
  try {
    const raw = await callClaude({ prompt, maxTokens: 800 })
    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    if (jsonMatch) adaptedPlan = JSON.parse(jsonMatch[0])
  } catch (err) {
    console.error('Adapt Claude call failed:', err)
  }

  if (adaptedPlan) {
    await admin
      .from('workout_logs')
      .update({ next_plan: adaptedPlan, ai_generated: true })
      .eq('id', log.id)
  }

  return NextResponse.json({ success: true, adapted_plan: adaptedPlan })
}
