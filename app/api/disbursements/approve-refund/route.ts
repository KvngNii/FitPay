import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { moolrePost, MOOLRE_ACCOUNT } from '@/lib/moolre'
import { internalHeaders } from '@/lib/internal'

const NETWORK_CHANNELS: Record<string, string> = {
  mtn: '1',
  telecel: '6',
  at: '7',
}

// Trainer approves a pending refund_request: fires the Moolre transfer, marks purchase refunded.
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
    .select('id, purchase_id, client_id, amount_ghs, network, status, sessions_requested')
    .eq('id', request_id)
    .eq('trainer_id', user.id)
    .single()

  if (!refundReq) return NextResponse.json({ error: 'Refund request not found' }, { status: 404 })
  if (refundReq.status !== 'pending') {
    return NextResponse.json({ error: `Request is already ${refundReq.status}` }, { status: 400 })
  }

  const { data: purchase } = await admin
    .from('purchases')
    .select('id, status, sessions_left')
    .eq('id', refundReq.purchase_id)
    .single()

  if (!purchase) return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })
  if (purchase.status === 'refunded') {
    return NextResponse.json({ error: 'Purchase already refunded' }, { status: 400 })
  }

  const channel = NETWORK_CHANNELS[refundReq.network]
  if (!channel) {
    return NextResponse.json({ error: 'Invalid network on request' }, { status: 400 })
  }

  const { data: client } = await admin
    .from('users')
    .select('phone, name')
    .eq('id', refundReq.client_id)
    .single()

  if (!client?.phone) return NextResponse.json({ error: 'Client has no phone on file' }, { status: 400 })

  const amountNum = Number(refundReq.amount_ghs)
  const externalref = randomUUID()

  const { error: insertError } = await admin.from('disbursements').insert({
    trainer_id: user.id,
    amount_ghs: amountNum,
    type: 'refund',
    recipient_phone: client.phone,
    moolre_ref: externalref,
    status: 'pending',
  })

  if (insertError) {
    console.error('Disbursement insert error on approval:', insertError)
    return NextResponse.json({ error: 'Failed to create disbursement record' }, { status: 500 })
  }

  let transferRes
  try {
    transferRes = await moolrePost('/open/transact/transfer', {
      type: 1,
      channel,
      currency: 'GHS',
      amount: String(amountNum),
      receiver: client.phone,
      externalref,
      reference: `FitPay refund for ${client.name}`,
      accountnumber: MOOLRE_ACCOUNT,
    })
    console.log('Moolre refund status:', transferRes.status)
  } catch (err) {
    console.error('Moolre transfer failed on refund approval:', err)
    await admin.from('disbursements').update({ status: 'failed' }).eq('moolre_ref', externalref)
    return NextResponse.json({ error: 'Transfer service unavailable. Try again.' }, { status: 502 })
  }

  type MoolreTransferData = { txstatus?: number; receivername?: string; transactionid?: string }
  const txdata = transferRes.data as MoolreTransferData | null
  const txstatus = txdata?.txstatus
  const apiSuccess = String(transferRes.status) === '1'

  let disbursementStatus: 'success' | 'pending' | 'failed' = 'pending'
  if (apiSuccess && txstatus === 1) disbursementStatus = 'success'
  else if (txstatus === 2) disbursementStatus = 'failed'
  else if (!apiSuccess) disbursementStatus = 'failed'

  await admin.from('disbursements').update({ status: disbursementStatus }).eq('moolre_ref', externalref)

  if (disbursementStatus === 'failed') {
    const msg = Array.isArray(transferRes.message)
      ? transferRes.message[0]
      : (transferRes.message ?? 'Transfer failed')
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  // Deduct the refunded sessions; only mark fully refunded if none remain
  const sessionsRequested = Number(refundReq.sessions_requested ?? 1)
  const newSessionsLeft = Math.max(0, purchase.sessions_left - sessionsRequested)
  const purchaseUpdate = newSessionsLeft === 0
    ? { sessions_left: 0, status: 'refunded' as const }
    : { sessions_left: newSessionsLeft }

  const now = new Date().toISOString()
  await Promise.all([
    admin.from('refund_requests').update({ status: 'approved', resolved_at: now }).eq('id', request_id),
    admin.from('purchases').update(purchaseUpdate).eq('id', refundReq.purchase_id),
  ])

  const sessionWord = sessionsRequested === 1 ? 'session' : 'sessions'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  fetch(`${appUrl}/api/sms/send`, {
    method: 'POST',
    headers: internalHeaders(),
    body: JSON.stringify({
      to: client.phone,
      message: `Hi ${client.name}, your FitPay refund of GH₵${amountNum} for ${sessionsRequested} ${sessionWord} has been approved and is on its way to your mobile money. Sent by FitPay`,
    }),
  }).catch(() => {})

  return NextResponse.json({
    success: true,
    amount: amountNum,
    status: disbursementStatus,
    transactionid: txdata?.transactionid,
  })
}
