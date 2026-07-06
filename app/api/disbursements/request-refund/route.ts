import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'

const VALID_NETWORKS = ['mtn', 'telecel', 'at']

// Client-initiated: creates a refund_request record for trainer review.
// No money moves until the trainer approves via /api/disbursements/approve-refund.
export async function POST(req: NextRequest) {
  const auth = createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { purchase_id, network } = await req.json()

  if (!purchase_id || !network) {
    return NextResponse.json({ error: 'purchase_id and network are required' }, { status: 400 })
  }
  if (!VALID_NETWORKS.includes(network)) {
    return NextResponse.json({ error: 'Invalid network. Use mtn, telecel, or at' }, { status: 400 })
  }

  const admin = createAdminSupabaseClient()

  const { data: purchase } = await admin
    .from('purchases')
    .select('id, status, client_id, packages(price_ghs)')
    .eq('id', purchase_id)
    .single()

  if (!purchase) return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })
  if (purchase.client_id !== user.id) {
    return NextResponse.json({ error: 'This purchase does not belong to your account' }, { status: 403 })
  }
  if (purchase.status === 'pending') {
    return NextResponse.json({ error: 'Payment is still pending — cannot request a refund yet' }, { status: 400 })
  }
  if (purchase.status === 'refunded') {
    return NextResponse.json({ error: 'This purchase has already been refunded' }, { status: 400 })
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

  const amountNum = Number((purchase.packages as unknown as { price_ghs: number } | null)?.price_ghs ?? 0)
  if (amountNum <= 0) {
    return NextResponse.json({ error: 'Invalid refund amount' }, { status: 400 })
  }

  const { error: insertError } = await admin.from('refund_requests').insert({
    purchase_id,
    client_id: user.id,
    amount_ghs: amountNum,
    network,
    status: 'pending',
  })

  if (insertError) {
    console.error('Refund request insert error:', insertError)
    return NextResponse.json({ error: 'Could not create refund request. Try again.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
