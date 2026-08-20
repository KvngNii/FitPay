import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { moolrePostPub, MOOLRE_ACCOUNT } from '@/lib/moolre'
import type { MoolrePaymentLinkData } from '@/types'

export async function POST(req: NextRequest) {
  const auth = createServerSupabaseClient()
  const admin = createAdminSupabaseClient()

  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await admin
    .from('users')
    .select('role, email, name, trainer_id')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'client') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { package_id } = body
  if (!package_id) {
    return NextResponse.json({ error: 'package_id required' }, { status: 400 })
  }

  const { data: pkg } = await admin
    .from('packages')
    .select('id, name, sessions, price_ghs, duration_days')
    .eq('id', package_id)
    .eq('is_active', true)
    .single()

  if (!pkg) {
    return NextResponse.json({ error: 'Package not found' }, { status: 404 })
  }

  const externalref = randomUUID()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + pkg.duration_days)

  const { error: insertError } = await admin.from('purchases').insert({
    client_id: user.id,
    trainer_id: profile.trainer_id,
    package_id: pkg.id,
    moolre_ref: externalref,
    status: 'pending',
    sessions_left: pkg.sessions,
    expires_at: expiresAt.toISOString(),
  })

  if (insertError) {
    console.error('Purchase insert error:', insertError)
    return NextResponse.json({ error: 'Failed to create purchase record' }, { status: 500 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  const linkPayload = {
    type: 1,
    amount: String(pkg.price_ghs),
    email: profile.email ?? `client-${user.id.slice(0, 8)}@fitpay.app`,
    externalref,
    callback: `${appUrl}/api/webhooks/moolre`,
    redirect: `${appUrl}/client/packages?payment=success`,
    reusable: '0',
    expiration_time: 30,
    currency: 'GHS',
    accountnumber: MOOLRE_ACCOUNT,
    metadata: { package_id: pkg.id, client_id: user.id, package_name: pkg.name },
  }
  let moolreRes
  try {
    moolreRes = await moolrePostPub<MoolrePaymentLinkData>('/embed/link', linkPayload)
  } catch (err) {
    console.error('Moolre call failed:', err)
    await admin.from('purchases').delete().eq('moolre_ref', externalref)
    return NextResponse.json({ error: 'Payment service unavailable' }, { status: 502 })
  }

  if (moolreRes.status !== 1 || !moolreRes.data?.authorization_url) {
    await admin.from('purchases').delete().eq('moolre_ref', externalref)
    return NextResponse.json(
      { error: moolreRes.message ?? 'Payment initiation failed' },
      { status: 400 }
    )
  }

  return NextResponse.json({ authorization_url: moolreRes.data.authorization_url })
}
