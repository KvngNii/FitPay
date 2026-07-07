import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const auth = createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminSupabaseClient()
  const { data: profile } = await admin.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'trainer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { session_id } = await req.json()
  if (!session_id) return NextResponse.json({ error: 'session_id required' }, { status: 400 })

  const { data: session } = await admin
    .from('sessions')
    .select('id, status, purchase_id, client_id, trainer_id')
    .eq('id', session_id)
    .single()

  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  if (session.trainer_id !== user.id) {
    return NextResponse.json({ error: 'That session is not on your roster' }, { status: 403 })
  }
  if (session.status !== 'scheduled') {
    return NextResponse.json({ error: 'Only scheduled sessions can be cancelled' }, { status: 400 })
  }

  // Cancel the session
  await admin.from('sessions').update({ status: 'cancelled' }).eq('id', session_id)

  // Return the session credit to the purchase
  const { data: purchase } = await admin
    .from('purchases')
    .select('sessions_left')
    .eq('id', session.purchase_id)
    .single()

  if (purchase) {
    await admin
      .from('purchases')
      .update({ sessions_left: purchase.sessions_left + 1 })
      .eq('id', session.purchase_id)
  }

  // SMS the client (non-blocking)
  const { data: client } = await admin.from('users').select('phone, name').eq('id', session.client_id).single()
  if (client?.phone) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!
    fetch(`${appUrl}/api/sms/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: client.phone,
        message: `Hi ${client.name}, your upcoming session has been cancelled. Your session credit has been returned. Sent by FitPay`,
      }),
    }).catch(() => {})
  }

  return NextResponse.json({ success: true })
}
