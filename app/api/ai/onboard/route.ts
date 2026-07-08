import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { callClaude } from '@/lib/ai/claude'
import { internalHeaders } from '@/lib/internal'

export async function POST() {
  // Triggered by the client from the browser as they finish onboarding, so it
  // requires an authenticated session and only ever runs for the caller's own
  // account — a client_id from the body is ignored.
  const auth = createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const client_id = user.id

  const admin = createAdminSupabaseClient()

  const [{ data: client }, { data: history }] = await Promise.all([
    admin
      .from('users')
      .select('name, goal, fitness_level, date_of_birth, gender, height_cm, weight_kg')
      .eq('id', client_id)
      .single(),
    admin
      .from('medical_history')
      .select('heart_condition_or_bp, chest_pain, dizziness_or_consciousness, chronic_condition, chronic_condition_details, prescribed_medication, medication_details, bone_or_joint_problem, bone_or_joint_details, previous_injuries_surgeries, current_pain_areas, allergies')
      .eq('client_id', client_id)
      .maybeSingle(),
  ])

  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const goalLabels: Record<string, string> = {
    weight_loss: 'weight loss',
    strength: 'building strength',
    endurance: 'improving endurance',
    general: 'general fitness',
  }

  const age = client.date_of_birth
    ? Math.floor((Date.now() - new Date(client.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  const medicalLines: string[] = []
  if (history) {
    if (history.heart_condition_or_bp) medicalLines.push('Heart condition or high blood pressure')
    if (history.chest_pain) medicalLines.push('Chest pain at rest or during activity')
    if (history.dizziness_or_consciousness) medicalLines.push('Dizziness / loss of consciousness (past 12 months)')
    if (history.chronic_condition) medicalLines.push(`Chronic condition: ${history.chronic_condition_details || 'unspecified'}`)
    if (history.prescribed_medication) medicalLines.push(`Prescribed medication: ${history.medication_details || 'unspecified'}`)
    if (history.bone_or_joint_problem) medicalLines.push(`Bone/joint/muscle problem: ${history.bone_or_joint_details || 'unspecified'}`)
    if (history.previous_injuries_surgeries) medicalLines.push(`Previous injuries/surgeries: ${history.previous_injuries_surgeries}`)
    if (history.current_pain_areas) medicalLines.push(`Current pain areas: ${history.current_pain_areas}`)
    if (history.allergies) medicalLines.push(`Allergies: ${history.allergies}`)
  }
  const medicalSummary = medicalLines.length > 0 ? medicalLines.join('; ') : 'None reported'

  const prompt = `Create a starter workout plan for a new personal training client.

Client:
- Name: ${client.name}
- Goal: ${goalLabels[client.goal ?? 'general'] ?? 'general fitness'}
- Fitness level: ${client.fitness_level ?? 'beginner'}
${age ? `- Age: ${age}\n` : ''}${client.gender ? `- Gender: ${client.gender}\n` : ''}${client.height_cm ? `- Height: ${client.height_cm} cm\n` : ''}${client.weight_kg ? `- Weight: ${client.weight_kg} kg\n` : ''}- Medical / injury notes: ${medicalSummary}

Output ONLY a JSON array of 5 exercises for their first session. Each exercise must follow this exact shape:
{"name": string, "sets": number, "reps": number, "weight_kg": number, "difficulty": "moderate", "notes": string}

Use weight_kg of 0 for bodyweight exercises. If health notes mention any injury or condition, choose exercises that avoid aggravating it and mention the consideration in that exercise's notes. Return ONLY the JSON array, no other text.`

  let plan = null
  try {
    const raw = await callClaude({ prompt, maxTokens: 800 })
    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    if (jsonMatch) plan = JSON.parse(jsonMatch[0])
  } catch (err) {
    console.error('Onboard Claude call failed:', err)
  }

  // Upsert progression_rules row for this client
  const { data: existing } = await admin
    .from('progression_rules')
    .select('id')
    .eq('client_id', client_id)
    .single()

  if (existing) {
    await admin
      .from('progression_rules')
      .update({ initial_plan: plan, last_updated: new Date().toISOString() })
      .eq('client_id', client_id)
  } else {
    await admin.from('progression_rules').insert({
      client_id,
      goal: client.goal ?? 'general',
      sessions_in_phase: 0,
      deload_every_n: 4,
      initial_plan: plan,
    })
  }

  // SMS the trainer with a heads-up (non-blocking)
  const [{ data: trainer }] = await Promise.all([
    admin.from('users').select('phone, name').eq('role', 'trainer').single(),
  ])
  if (trainer?.phone && client) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!
    const msg = `New client ${client.name} just signed up on FitPay! Goal: ${goalLabels[client.goal ?? 'general']}. Check the app for their plan.`
    fetch(`${appUrl}/api/sms/send`, {
      method: 'POST',
      headers: internalHeaders(),
      body: JSON.stringify({ to: trainer.phone, message: msg.slice(0, 160) }),
    }).catch(() => {})
  }

  return NextResponse.json({ success: true, plan })
}
