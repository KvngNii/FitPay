import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { moolrePost, MOOLRE_ACCOUNT } from '@/lib/moolre'

// Channel codes for Moolre transfers
const NETWORK_CHANNELS: Record<string, string> = {
  mtn: '1',
  telecel: '6',
  at: '7',
}

// Processes a client refund via Moolre transfer API. Trainer-only.
export async function POST(req: NextRequest) {
  const auth = createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminSupabaseClient()

  const { data: profile } = await admin.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'trainer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { purchase_id, network } = await req.json()
  if (!purchase_id || !network) {
    return NextResponse.json({ error: 'purchase_id and network are required' }, { status: 400 })
  }

  const channel = NETWORK_CHANNELS[network]
  if (!channel) {
    return NextResponse.json({ error: 'Invalid network. Use mtn, telecel, or at' }, { status: 400 })
  }

  const { data: purchase } = await admin
    .from('purchases')
    .select('id, status, client_id, trainer_id, packages(price_ghs)')
    .eq('id', purchase_id)
    .single()

  if (!purchase) return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })
  if (purchase.trainer_id !== user.id) {
    return NextResponse.json({ error: 'That purchase is not on your roster' }, { status: 403 })
  }
  if (purchase.status === 'refunded') {
    return NextResponse.json({ error: 'Purchase already refunded' }, { status: 400 })
  }

  const amountNum = Number((purchase.packages as unknown as { price_ghs: number } | null)?.price_ghs ?? 0)
  if (amountNum <= 0) {
    return NextResponse.json({ error: 'Invalid refund amount' }, { status: 400 })
  }

  const { data: client } = await admin
    .from('users')
    .select('phone, name')
    .eq('id', purchase.client_id)
    .single()

  if (!client?.phone) return NextResponse.json({ error: 'Client has no phone on file' }, { status: 400 })

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
    console.error('Refund disbursement insert error:', insertError)
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
      reference: `FitPay refund for ${client.name}`,
      accountnumber: MOOLRE_ACCOUNT,
    })
    console.log('Moolre refund transfer response:', JSON.stringify(transferRes))
  } catch (err) {
    console.error('Moolre refund transfer failed:', err)
    await admin.from('disbursements').update({ status: 'failed' }).eq('moolre_ref', externalref)
    return NextResponse.json({ error: 'Transfer service unavailable' }, { status: 502 })
  }

  // txstatus: 1=Success, 0=Pending, 2=Failed, 3=Unknown
  // Per Moolre docs: never assume failure unless txstatus=2
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

  // Only mark the purchase refunded once the transfer is confirmed (or pending review)
  await admin.from('purchases').update({ status: 'refunded' }).eq('id', purchase_id)

  if (client.phone) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!
    fetch(`${appUrl}/api/sms/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: client.phone,
        message: `Hi ${client.name}, GH₵${amountNum} has been refunded to your ${network.toUpperCase()} mobile money. Sent by FitPay`,
      }),
    }).catch(() => {})
  }

  return NextResponse.json({
    success: true,
    amount: amountNum,
    receiver: txdata?.receivername ?? client.phone,
    transactionid: txdata?.transactionid,
    status: disbursementStatus,
  })
}
