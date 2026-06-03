import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { MoolreWebhookPayload } from '@/types'

// Always return HTTP 200 — Moolre retries on any non-200 response.
// Idempotent: check moolre_ref before processing. Duplicate = return 200 immediately.
export async function POST(req: NextRequest) {
  try {
    const payload: MoolreWebhookPayload = await req.json()

    // Only process confirmed successful payments
    if (payload.status !== 1 || payload.data?.txstatus !== 1) {
      return NextResponse.json({ received: true })
    }

    const externalref = payload.data?.externalref
    if (!externalref) return NextResponse.json({ received: true })

    const supabase = createServerSupabaseClient()

    // Idempotency: fetch existing purchase by moolre_ref
    const { data: purchase } = await supabase
      .from('purchases')
      .select('id, status, client_id, package_id, sessions_left')
      .eq('moolre_ref', externalref)
      .single()

    if (!purchase) return NextResponse.json({ received: true })

    // Already processed — return 200 without re-processing
    if (purchase.status === 'active') return NextResponse.json({ received: true })

    // Activate the purchase
    const { error } = await supabase
      .from('purchases')
      .update({ status: 'active' })
      .eq('moolre_ref', externalref)
      .eq('status', 'pending') // extra guard against race conditions

    if (error) {
      console.error('Webhook: failed to activate purchase', error)
      return NextResponse.json({ received: true })
    }

    // Fetch client and package for SMS confirmation
    const [{ data: client }, { data: pkg }] = await Promise.all([
      supabase.from('users').select('phone, name').eq('id', purchase.client_id).single(),
      supabase.from('packages').select('name, sessions').eq('id', purchase.package_id).single(),
    ])

    // Fire SMS confirmation — non-blocking
    if (client?.phone && pkg) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL!
      fetch(`${appUrl}/api/sms/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: client.phone,
          message: `Hi ${client.name}! Your ${pkg.name} (${pkg.sessions} sessions) is now active on FitPay. Let's get to work!`,
        }),
      }).catch((e) => console.error('Webhook: SMS send failed', e))
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook error:', err)
    // Still return 200 — we never want Moolre to retry indefinitely on our bugs
    return NextResponse.json({ received: true })
  }
}
