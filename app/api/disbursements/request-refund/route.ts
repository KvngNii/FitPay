import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'

const VALID_NETWORKS = ['mtn', 'telecel', 'at']

// Client-initiated: creates a refund_request record for trainer review.
// sessions_requested controls pro-rating: 2 out of 5 sessions = 40% of price.
// No money moves until the trainer approves via /api/disbursements/approve-refund.
export async function POST(req: NextRequest) {
  const auth = createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { purchase_id, network, sessions_requested } = await req.json()

  if (!purchase_id || !network) {
    return NextResponse.json({ error: 'purchase_id and network are required' }, { status: 400 })
  }
  if (!VALID_NETWORKS.includes(network)) {
    return NextResponse.json({ error: 'Invalid network. Use mtn, telecel, or at' }, { status: 400 })
  }
  if (!Number.isInteger(sessions_requested) || sessions_requested < 1) {
    return NextResponse.json({ error: 'sessions_requested must be a positive integer' }, { status: 400 })
  }

  const admin = createAdminSupabaseClient()

  const { data: purchase } = await admin
    .from('purchases')
    .select('id, status, client_id, sessions_left, packages(price_ghs, sessions)')
    .eq('id', purchase_id)
    .single()

  if (!purchase) return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })
  if (purchase.client_id !== user.id) {
    return NextResponse.json({ error: 'This purchase does not belong to your account' }, { status: 403 })
  }
  if (purchase.status === 'pending') {
    return NextResponse.json({ error: 'Payment is still pending, so you cannot request a refund yet' }, { status: 400 })
  }
  if (purchase.status === 'refunded') {
    return NextResponse.json({ error: 'This purchase has already been refunded' }, { status: 400 })
  }
  if (sessions_requested > purchase.sessions_left) {
    return NextResponse.json({
      error: `You only have ${purchase.sessions_left} session${purchase.sessions_left !== 1 ? 's' : ''} remaining`,
    }, { status: 400 })
  }

  // Block duplicate pending or approved requests for the same purchase
  const { data: existing } = await admin
    .from('refund_requests')
    .select('id, status')
    .eq('purchase_id', purchase_id)
    .in('status', ['pending', 'approved'])
    .maybeSingle()

  if (existing) {
    const msg = existing.status === 'approved'
      ? 'A refund for this purchase has already been approved'
      : 'A refund request for this purchase is already pending'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const pkg = purchase.packages as unknown as { price_ghs: number; sessions: number } | null
  const totalSessions = pkg?.sessions ?? 0
  const fullPrice = Number(pkg?.price_ghs ?? 0)

  if (totalSessions <= 0 || fullPrice <= 0) {
    return NextResponse.json({ error: 'Invalid package data' }, { status: 400 })
  }

  // Pro-rate: round to 2 decimal places
  const proRatedAmount = Math.round((sessions_requested / totalSessions) * fullPrice * 100) / 100

  const { error: insertError } = await admin.from('refund_requests').insert({
    purchase_id,
    client_id: user.id,
    amount_ghs: proRatedAmount,
    network,
    sessions_requested,
    status: 'pending',
  })

  if (insertError) {
    console.error('Refund request insert error:', insertError)
    return NextResponse.json({ error: 'Could not create refund request. Try again.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, amount: proRatedAmount })
}
