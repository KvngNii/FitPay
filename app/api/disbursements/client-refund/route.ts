import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { moolrePost, MOOLRE_ACCOUNT } from '@/lib/moolre'

const NETWORK_CHANNELS: Record<string, string> = {
  mtn: '1',
  telecel: '6',
  at: '7',
}

// Client-initiated reimbursement — authenticated client requests a refund for their own purchase.
export async function POST(req: NextRequest) {
  const auth = createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminSupabaseClient()

  const { purchase_id, network } = await req.json()
  if (!purchase_id || !network) {
    return NextResponse.json({ error: 'purchase_id and network are required' }, { status: 400 })
  }

  const channel = NETWORK_CHANNELS[network]
  if (!channel) {
    return NextResponse.json({ error: 'Invalid network. Use mtn, telecel, or at' }, { status: 400 })
  }

  // Verify the purchase belongs to this client
  const { data: purchase } = await admin
    .from('purchases')
    .select('id, status, client_id, sessions_left, packages(price_ghs, name)')
    .eq('id', purchase_id)
    .single()

  if (!purchase) return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })
  if (purchase.client_id !== user.id) {
    return NextResponse.json({ error: 'This purchase does not belong to your account' }, { status: 403 })
  }
  if (purchase.status === 'refunded') {
    return NextResponse.json({ error: 'This purchase has already been refunded' }, { status: 400 })
  }
  if (purchase.status === 'pending') {
    return NextResponse.json({ error: 'Payment is still pending — cannot refund yet' }, { status: 400 })
  }

  const pkg = purchase.packages as unknown as { price_ghs: number; name: string } | null
  const amountNum = Number(pkg?.price_ghs ?? 0)
  if (amountNum <= 0) {
    return NextResponse.json({ error: 'Invalid refund amount' }, { status: 400 })
  }

  const { data: client } = await admin
    .from('users')
    .select('phone, name')
    .eq('id', user.id)
    .single()

  if (!client?.phone) {
    return NextResponse.json({ error: 'No phone number on your account' }, { status: 400 })
  }

  // Find trainer to record disbursement against
  const { data: trainer } = await admin
    .from('users')
    .select('id')
    .eq('role', 'trainer')
    .limit(1)
    .single()

  const externalref = randomUUID()

  const { error: insertError } = await admin.from('disbursements').insert({
    trainer_id: trainer?.id ?? user.id,
    amount_ghs: amountNum,
    type: 'refund',
    recipient_phone: client.phone,
    moolre_ref: externalref,
    status: 'pending',
  })

  if (insertError) {
    console.error('Client refund insert error:', insertError)
    return NextResponse.json({ error: 'Failed to create refund record' }, { status: 500 })
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
      reference: `FitPay refund - ${pkg?.name ?? 'package'}`,
      accountnumber: MOOLRE_ACCOUNT,
    })
    console.log('Client refund transfer response:', JSON.stringify(transferRes))
  } catch (err) {
    console.error('Moolre client refund failed:', err)
    await admin.from('disbursements').update({ status: 'failed' }).eq('moolre_ref', externalref)
    return NextResponse.json({ error: 'Transfer service unavailable. Try again later.' }, { status: 502 })
  }

  type MoolreTransferData = { txstatus?: number; receivername?: string; transactionid?: string }
  const txdata = transferRes.data as MoolreTransferData | null
  const txstatus = txdata?.txstatus
  const apiSuccess = String(transferRes.status) === '1'

  let disbursementStatus: 'success' | 'pending' | 'failed' = 'pending'
  if (apiSuccess && txstatus === 1) disbursementStatus = 'success'
  else if (txstatus === 2) disbursementStatus = 'failed'
  else if (!apiSuccess) disbursementStatus = 'failed'

  await admin
    .from('disbursements')
    .update({ status: disbursementStatus })
    .eq('moolre_ref', externalref)

  if (disbursementStatus === 'failed') {
    const msg = Array.isArray(transferRes.message)
      ? transferRes.message[0]
      : (transferRes.message ?? 'Refund failed')
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  // Mark purchase as refunded and zero out remaining sessions
  await admin
    .from('purchases')
    .update({ status: 'refunded', sessions_left: 0 })
    .eq('id', purchase_id)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  fetch(`${appUrl}/api/sms/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: client.phone,
      message: `Hi ${client.name}, your FitPay refund of GH₵${amountNum} is on its way to your ${network.toUpperCase()} mobile money. - FitPay`,
    }),
  }).catch(() => {})

  return NextResponse.json({
    success: true,
    amount: amountNum,
    receiver: txdata?.receivername ?? client.phone,
    transactionid: txdata?.transactionid,
    status: disbursementStatus,
  })
}
