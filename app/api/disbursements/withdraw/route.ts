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

export async function POST(req: NextRequest) {
  const auth = createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminSupabaseClient()

  const { data: profile } = await admin
    .from('users')
    .select('role, phone, name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'trainer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { amount, phone, network } = body

  if (!amount || !phone || !network) {
    return NextResponse.json({ error: 'amount, phone, and network are required' }, { status: 400 })
  }

  const amountNum = Number(amount)
  if (isNaN(amountNum) || amountNum <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
  }

  const channel = NETWORK_CHANNELS[network]
  if (!channel) {
    return NextResponse.json({ error: 'Invalid network. Use mtn, telecel, or at' }, { status: 400 })
  }

  // Calculate available balance
  const [{ data: purchases }, { data: prevDisbursements }] = await Promise.all([
    admin
      .from('purchases')
      .select('packages(price_ghs)')
      .in('status', ['active', 'expired']),
    admin
      .from('disbursements')
      .select('amount_ghs')
      .eq('trainer_id', user.id)
      .eq('status', 'success')
      .eq('type', 'withdrawal'),
  ])

  const totalRevenue = (purchases ?? []).reduce((sum: number, p) => sum + Number((p.packages as unknown as { price_ghs: number } | null)?.price_ghs ?? 0), 0)
  const totalWithdrawn = (prevDisbursements ?? []).reduce((sum: number, d) => sum + Number(d.amount_ghs), 0)
  const available = totalRevenue - totalWithdrawn

  if (amountNum > available) {
    return NextResponse.json({ error: `Insufficient balance. Available: GH₵${available}` }, { status: 400 })
  }

  const externalref = randomUUID()

  // Create pending disbursement record first
  const { error: insertError } = await admin.from('disbursements').insert({
    trainer_id: user.id,
    amount_ghs: amountNum,
    type: 'withdrawal',
    recipient_phone: phone,
    moolre_ref: externalref,
    status: 'pending',
  })

  if (insertError) {
    console.error('Disbursement insert error:', insertError)
    return NextResponse.json({ error: 'Failed to create disbursement record' }, { status: 500 })
  }

  // Call Moolre transfer API
  let transferRes
  try {
    transferRes = await moolrePost('/open/transact/transfer', {
      type: 1,
      channel,
      currency: 'GHS',
      amount: String(amountNum),
      receiver: phone,
      externalref,
      reference: `FitPay withdrawal for ${profile.name}`,
      accountnumber: MOOLRE_ACCOUNT,
    })
    console.log('Moolre transfer response:', JSON.stringify(transferRes))
  } catch (err) {
    console.error('Moolre transfer failed:', err)
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
      : (transferRes.message ?? 'Transfer failed')
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  return NextResponse.json({
    success: true,
    amount: amountNum,
    receiver: txdata?.receivername ?? phone,
    transactionid: txdata?.transactionid,
    status: disbursementStatus,
  })
}
