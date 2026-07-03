import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { bookSession } from '@/lib/sessions/book'

export async function POST(req: NextRequest) {
  const auth = createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminSupabaseClient()
  const { data: profile } = await admin.from('users').select('role').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { scheduled_at, notes } = body

  let client_id: string
  let trainer_id: string

  if (profile.role === 'trainer') {
    client_id = body.client_id
    trainer_id = user.id
  } else {
    // Clients can only book for themselves
    client_id = user.id
    const { data: trainer } = await admin.from('users').select('id').eq('role', 'trainer').limit(1).single()
    if (!trainer) return NextResponse.json({ error: 'No trainer available' }, { status: 500 })
    trainer_id = trainer.id
  }

  if (!client_id || !scheduled_at) {
    return NextResponse.json({ error: 'client_id and scheduled_at are required' }, { status: 400 })
  }

  const result = await bookSession(admin, { client_id, trainer_id, scheduled_at, notes })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true, session_id: result.session_id })
}
