import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { callClaude } from '@/lib/ai/claude'

export async function POST(req: NextRequest) {
  const { client_id } = await req.json()
  if (!client_id) return NextResponse.json({ error: 'client_id required' }, { status: 400 })

  const admin = createAdminSupabaseClient()

  const { data: client } = await admin
    .from('users')
    .select('name, goal, fitness_level')
    .eq('id', client_id)
    .single()

  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const goalLabels: Record<string, string> = {
    weight_loss: 'weight loss',
    strength: 'building strength',
    endurance: 'improving endurance',
    general: 'general fitness',
  }

  const prompt = `Create a starter workout plan for a new personal training client.

Client:
- Name: ${client.name}
- Goal: ${goalLabels[client.goal ?? 'general'] ?? 'general fitness'}
- Fitness level: ${client.fitness_level ?? 'beginner'}

Output ONLY a JSON array of 5 exercises for their first session. Each exercise must follow this exact shape:
{"name": string, "sets": number, "reps": number, "weight_kg": number, "difficulty": "moderate", "notes": string}

Use weight_kg of 0 for bodyweight exercises. Return ONLY the JSON array, no other text.`

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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: trainer.phone, message: msg.slice(0, 160) }),
    }).catch(() => {})
  }

  return NextResponse.json({ success: true, plan })
}
