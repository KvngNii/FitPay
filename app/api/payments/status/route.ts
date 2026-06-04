import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const auth = createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { moolre_ref } = await req.json()
  if (!moolre_ref) return NextResponse.json({ error: 'moolre_ref required' }, { status: 400 })

  const admin = createAdminSupabaseClient()
  const { data: purchase } = await admin
    .from('purchases')
    .select('status, sessions_left, expires_at, package_id')
    .eq('moolre_ref', moolre_ref)
    .eq('client_id', user.id)
    .single()

  if (!purchase) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    status: purchase.status,
    sessions_left: purchase.sessions_left,
    expires_at: purchase.expires_at,
  })
}
