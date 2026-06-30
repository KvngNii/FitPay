import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const auth = createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminSupabaseClient()
  const { data: profile } = await admin.from('users').select('role').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { scheduled_at, notes } = body

  let client_id: string
  let trainer_id: string

  if (profile.role === 'trainer') {
    client_id = body.client_id
    trainer_id = user.id
  } else {
    // Clients can only book for themselves
    client_id = user.id
    const { data: trainer } = await admin.from('users').select('id').eq('role', 'trainer').limit(1).single()
    if (!trainer) return NextResponse.json({ error: 'No trainer available' }, { status: 500 })
    trainer_id = trainer.id
  }

  if (!client_id || !scheduled_at) {
    return NextResponse.json({ error: 'client_id and scheduled_at are required' }, { status: 400 })
  }

  // Find active purchase with sessions remaining
  const { data: purchase } = await admin
    .from('purchases')
    .select('id, sessions_left')
    .eq('client_id', client_id)
    .eq('status', 'active')
    .gt('sessions_left', 0)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (!purchase) {
    return NextResponse.json({ error: 'Client has no active package with sessions remaining' }, { status: 400 })
  }

  // Prevent double-booking the same slot
  const { data: clash } = await admin
    .from('sessions')
    .select('id')
    .eq('scheduled_at', scheduled_at)
    .eq('status', 'scheduled')
    .limit(1)
    .maybeSingle()

  if (clash) {
    return NextResponse.json({ error: 'That time slot is already booked' }, { status: 400 })
  }

  // Insert session
  const { data: session, error: sessionError } = await admin
    .from('sessions')
    .insert({
      client_id,
      trainer_id,
      purchase_id: purchase.id,
      scheduled_at,
      status: 'scheduled',
      notes: notes ?? null,
    })
    .select('id')
    .single()

  if (sessionError) {
    console.error('Session insert error:', sessionError)
    return NextResponse.json({ error: 'Failed to book session' }, { status: 500 })
  }

  // Decrement sessions_left
  await admin
    .from('purchases')
    .update({ sessions_left: purchase.sessions_left - 1 })
    .eq('id', purchase.id)

  // SMS the client
  const [{ data: client }] = await Promise.all([
    admin.from('users').select('phone, name').eq('id', client_id).single(),
  ])

  if (client?.phone) {
    const date = new Date(scheduled_at)
    const dateStr = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    const msg = `Hi ${client.name}! Your session is booked for ${dateStr} at ${timeStr}. See you then! - FitPay`
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!
    fetch(`${appUrl}/api/sms/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: client.phone, message: msg.slice(0, 160) }),
    }).catch(() => {})
  }

  return NextResponse.json({ success: true, session_id: session.id })
}
