import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { internalHeaders } from '@/lib/internal'

// Trainers can cancel any session on their own roster. Clients can cancel
// their own sessions too, but only ones that haven't happened yet — this is
// what makes an unused session eligible for a refund request afterwards.
export async function POST(req: NextRequest) {
  const auth = createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminSupabaseClient()
  const { data: profile } = await admin.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'trainer' && profile?.role !== 'client') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { session_id } = await req.json()
  if (!session_id) return NextResponse.json({ error: 'session_id required' }, { status: 400 })

  const { data: session } = await admin
    .from('sessions')
    .select('id, status, scheduled_at, purchase_id, client_id, trainer_id')
    .eq('id', session_id)
    .single()

  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  if (profile.role === 'trainer') {
    if (session.trainer_id !== user.id) {
      return NextResponse.json({ error: 'That session is not on your roster' }, { status: 403 })
    }
  } else {
    if (session.client_id !== user.id) {
      return NextResponse.json({ error: 'That session does not belong to your account' }, { status: 403 })
    }
    if (new Date(session.scheduled_at) <= new Date()) {
      return NextResponse.json({ error: 'This session has already happened and can no longer be cancelled' }, { status: 400 })
    }
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

  // SMS the other party (non-blocking) — whoever didn't just cancel it
  const notifyId = profile.role === 'trainer' ? session.client_id : session.trainer_id
  const { data: notify } = await admin.from('users').select('phone, name').eq('id', notifyId).single()
  if (notify?.phone) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!
    const message = profile.role === 'trainer'
      ? `Hi ${notify.name}, your upcoming session has been cancelled. Your session credit has been returned. Sent by FitPay`
      : `Hi ${notify.name}, a client cancelled their upcoming session. Your calendar has been freed up. Sent by FitPay`
    fetch(`${appUrl}/api/sms/send`, {
      method: 'POST',
      headers: internalHeaders(),
      body: JSON.stringify({ to: notify.phone, message }),
    }).catch(() => {})
  }

  return NextResponse.json({ success: true })
}
