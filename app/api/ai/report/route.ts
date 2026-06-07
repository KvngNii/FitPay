import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { callClaude } from '@/lib/ai/claude'

export async function POST(req: NextRequest) {
  const { client_id } = await req.json()
  if (!client_id) return NextResponse.json({ error: 'client_id required' }, { status: 400 })

  const admin = createAdminSupabaseClient()

  const [{ data: client }, { data: rule }, { data: recentSessions }] = await Promise.all([
    admin.from('users').select('name, goal, phone').eq('id', client_id).single(),
    admin.from('progression_rules').select('goal, sessions_in_phase').eq('client_id', client_id).single(),
    admin
      .from('sessions')
      .select('id, scheduled_at, workout_logs(overall_difficulty, exercises, injury_flag)')
      .eq('client_id', client_id)
      .eq('status', 'completed')
      .order('scheduled_at', { ascending: false })
      .limit(4),
  ])

  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const goalLabels: Record<string, string> = {
    weight_loss: 'weight loss',
    strength: 'building strength',
    endurance: 'improving endurance',
    general: 'general fitness',
  }

  const sessionSummary = (recentSessions ?? [])
    .map((s: any, i: number) => {
      const log = s.workout_logs
      if (!log) return `Session ${i + 1}: no log`
      const exerciseNames = (log.exercises ?? []).map((e: any) => e.name).join(', ')
      return `Session ${i + 1}: ${log.overall_difficulty} difficulty. Exercises: ${exerciseNames || 'none recorded'}.${log.injury_flag ? ' Injury reported.' : ''}`
    })
    .join('\n')

  const prompt = `You are a personal trainer writing a progress report for a client.

Client: ${client.name}
Goal: ${goalLabels[client.goal ?? 'general']}
Sessions completed total: ${rule?.sessions_in_phase ?? 0}

Last 4 sessions:
${sessionSummary}

Write 2 encouraging sentences about their progress and one specific thing to focus on next. Be personal and motivating. Keep it under 300 characters total.`

  let report = ''
  try {
    report = await callClaude({ prompt, maxTokens: 500 })
  } catch (err) {
    console.error('Report Claude call failed:', err)
    report = `Great work on your last 4 sessions, ${client.name}! Keep pushing toward your ${goalLabels[client.goal ?? 'general']} goal — you're making solid progress.`
  }

  // Send report via SMS (split if needed)
  if (client.phone) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!
    const message = report.slice(0, 155) + (report.length > 155 ? '…' : '')
    fetch(`${appUrl}/api/sms/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: client.phone, message }),
    }).catch(() => {})
  }

  return NextResponse.json({ success: true, report })
}
