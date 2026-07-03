import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { callClaude } from '@/lib/ai/claude'

export async function POST(req: NextRequest) {
  // Accepts optional client_id to check in a single client; otherwise processes all active clients
  const body = await req.json().catch(() => ({}))
  const { client_id } = body

  const admin = createAdminSupabaseClient()

  type ClientRow = { id: string; name: string; phone: string | null; goal: string | null }
  let clients: ClientRow[] = []

  if (client_id) {
    const { data } = await admin
      .from('users')
      .select('id, name, phone, goal')
      .eq('id', client_id)
      .eq('role', 'client')
      .single()
    if (data) clients = [data]
  } else {
    // All clients with an active purchase
    const { data: activePurchases } = await admin
      .from('purchases')
      .select('client_id, users!client_id(id, name, phone, goal)')
      .eq('status', 'active')
    const seen = new Set<string>()
    for (const p of activePurchases ?? []) {
      const c = p.users as unknown as ClientRow | null
      if (c?.id && !seen.has(c.id)) {
        seen.add(c.id)
        clients.push(c)
      }
    }
  }

  if (clients.length === 0) return NextResponse.json({ success: true, sent: 0 })

  const goalLabels: Record<string, string> = {
    weight_loss: 'weight loss',
    strength: 'building strength',
    endurance: 'improving endurance',
    general: 'general fitness',
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  let sent = 0

  for (const client of clients) {
    // Count sessions completed in the last 30 days
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { count } = await admin
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', client.id)
      .eq('status', 'completed')
      .gte('scheduled_at', since)

    const sessionsThisMonth = count ?? 0

    const prompt = `Write a short personalised monthly check-in SMS for a personal training client. Keep it under 155 characters total, warm and motivating.

Client name: ${client.name}
Goal: ${goalLabels[client.goal ?? 'general'] ?? 'general fitness'}
Sessions completed this month: ${sessionsThisMonth}

Return ONLY the SMS text, no quotes or labels.`

    let message = ''
    try {
      message = await callClaude({ prompt, maxTokens: 100 })
      message = message.trim().slice(0, 155)
    } catch (err) {
      console.error(`Checkin Claude call failed for ${client.name}:`, err)
      message = `Hey ${client.name}! Great work this month — ${sessionsThisMonth} session${sessionsThisMonth !== 1 ? 's' : ''} done. Keep pushing toward your ${goalLabels[client.goal ?? 'general']} goal!`.slice(0, 155)
    }

    if (client.phone) {
      fetch(`${appUrl}/api/sms/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: client.phone, message }),
      }).catch(() => {})
      sent++
    }
  }

  return NextResponse.json({ success: true, sent })
}
