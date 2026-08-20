import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'

// GET /api/sessions/availability?from=ISO&to=ISO
// Clients get booked slot datetimes (no names) plus their own bookings, so the
// calendar can show free vs taken vs "your session". Trainers get full session
// detail (client name + status) for their overview calendar.
export async function GET(req: NextRequest) {
  const auth = createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const from = req.nextUrl.searchParams.get('from')
  const to = req.nextUrl.searchParams.get('to')
  if (!from || !to) {
    return NextResponse.json({ error: 'from and to are required' }, { status: 400 })
  }

  const admin = createAdminSupabaseClient()
  const { data: profile } = await admin.from('users').select('role').eq('id', user.id).single()

  if (profile?.role === 'trainer') {
    const { data: sessions } = await admin
      .from('sessions')
      .select('id, scheduled_at, status, users!client_id(name)')
      .eq('trainer_id', user.id)
      .in('status', ['scheduled', 'completed'])
      .gte('scheduled_at', from)
      .lte('scheduled_at', to)
      .order('scheduled_at', { ascending: true })

    return NextResponse.json({
      sessions: (sessions ?? []).map((s) => ({
        id: s.id,
        scheduled_at: s.scheduled_at,
        status: s.status,
        client_name: (s.users as unknown as { name: string } | null)?.name ?? 'Client',
      })),
    })
  }

  // Client: which slots are taken on THEIR trainer's calendar, and which are
  // theirs. Scoped by trainer_id so one trainer's bookings don't block slots
  // on another trainer's calendar.
  const { data: client } = await admin.from('users').select('trainer_id').eq('id', user.id).single()
  if (!client?.trainer_id) {
    return NextResponse.json({ booked: [], mine: [] })
  }

  const { data: sessions } = await admin
    .from('sessions')
    .select('scheduled_at, client_id')
    .eq('trainer_id', client.trainer_id)
    .eq('status', 'scheduled')
    .gte('scheduled_at', from)
    .lte('scheduled_at', to)

  const booked = (sessions ?? []).map((s) => s.scheduled_at)
  const mine = (sessions ?? []).filter((s) => s.client_id === user.id).map((s) => s.scheduled_at)

  return NextResponse.json({ booked, mine })
}
