import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { internalHeaders } from '@/lib/internal'

// Trainer rejects a pending refund_request. No money moves.
export async function POST(req: NextRequest) {
  const auth = createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminSupabaseClient()

  const { data: profile } = await admin.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'trainer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { request_id } = await req.json()
  if (!request_id) {
    return NextResponse.json({ error: 'request_id is required' }, { status: 400 })
  }

  const { data: refundReq } = await admin
    .from('refund_requests')
    .select('id, status, client_id, amount_ghs, network')
    .eq('id', request_id)
    .eq('trainer_id', user.id)
    .single()

  if (!refundReq) return NextResponse.json({ error: 'Refund request not found' }, { status: 404 })
  if (refundReq.status !== 'pending') {
    return NextResponse.json({ error: `Request is already ${refundReq.status}` }, { status: 400 })
  }

  const now = new Date().toISOString()
  const { error } = await admin
    .from('refund_requests')
    .update({ status: 'rejected', resolved_at: now })
    .eq('id', request_id)

  if (error) {
    console.error('Refund request rejection error:', error)
    return NextResponse.json({ error: 'Could not reject request. Try again.' }, { status: 500 })
  }

  const { data: client } = await admin
    .from('users')
    .select('phone, name')
    .eq('id', refundReq.client_id)
    .single()

  if (client?.phone) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!
    fetch(`${appUrl}/api/sms/send`, {
      method: 'POST',
      headers: internalHeaders(),
      body: JSON.stringify({
        to: client.phone,
        message: `Hi ${client.name}, your refund request has been reviewed by your trainer. Please contact them directly for more details. Sent by FitPay`,
      }),
    }).catch(() => {})
  }

  return NextResponse.json({ success: true })
}
