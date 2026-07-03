import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const auth = createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminSupabaseClient()
  const { data: profile } = await admin.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'trainer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { client_id, trainer_notes } = await req.json()
  if (!client_id) return NextResponse.json({ error: 'client_id required' }, { status: 400 })

  // Verify the record exists before updating
  const { data: existing } = await admin
    .from('medical_history')
    .select('id, trainer_reviewed')
    .eq('client_id', client_id)
    .single()

  if (!existing) {
    console.error(`[medical-review] No medical_history found for client_id=${client_id}`)
    return NextResponse.json({ error: 'Medical history record not found' }, { status: 404 })
  }

  const { data: updated, error } = await admin
    .from('medical_history')
    .update({
      trainer_reviewed: true,
      trainer_reviewed_at: new Date().toISOString(),
      trainer_notes: trainer_notes ?? null,
    })
    .eq('client_id', client_id)
    .select('id, trainer_reviewed')

  if (error) {
    console.error('[medical-review] Update error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!updated || updated.length === 0) {
    console.error(`[medical-review] Update matched no rows for client_id=${client_id}`)
    return NextResponse.json({ error: 'Update failed — record not found' }, { status: 404 })
  }

  console.log(`[medical-review] Marked reviewed: client_id=${client_id}, trainer_reviewed=${updated[0]?.trainer_reviewed}`)

  return NextResponse.json({ success: true, trainer_reviewed: updated[0]?.trainer_reviewed })
}
