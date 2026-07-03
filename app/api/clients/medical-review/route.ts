import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const auth = createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminSupabaseClient()
  const { data: profile } = await admin.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'trainer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { client_id } = await req.json()
  if (!client_id) return NextResponse.json({ error: 'client_id required' }, { status: 400 })

  // Use a direct PL/pgSQL function to avoid PostgREST PATCH issues with
  // GENERATED ALWAYS AS STORED columns on the medical_history table.
  const { data: result, error: rpcError } = await admin.rpc(
    'mark_medical_history_reviewed',
    { p_client_id: client_id }
  )

  if (rpcError) {
    console.error('[medical-review] RPC error:', rpcError)
    return NextResponse.json({ error: rpcError.message }, { status: 500 })
  }

  const res = result as { success: boolean; trainer_reviewed?: boolean; error?: string } | null

  if (!res?.success) {
    console.error('[medical-review] RPC returned failure:', res)
    return NextResponse.json({ error: res?.error ?? 'Update failed' }, { status: 404 })
  }

  console.log(`[medical-review] OK client_id=${client_id} trainer_reviewed=${res.trainer_reviewed}`)
  return NextResponse.json({ success: true, trainer_reviewed: res.trainer_reviewed })
}
