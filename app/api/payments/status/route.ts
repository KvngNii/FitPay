import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// Checks payment status from our DB by moolre_ref.
// Used by the client packages page after returning from Moolre's hosted payment page.
// Body: { moolre_ref: string }
export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { moolre_ref } = await req.json()
  if (!moolre_ref) return NextResponse.json({ error: 'moolre_ref required' }, { status: 400 })

  const { data: purchase } = await supabase
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
