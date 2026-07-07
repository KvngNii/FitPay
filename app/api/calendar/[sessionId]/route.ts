import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { buildIcs } from '@/lib/calendar'

// GET /api/calendar/[sessionId] — download an .ics for a session.
// Only the session's client or trainer may fetch it.
export async function GET(_req: NextRequest, { params }: { params: { sessionId: string } }) {
  const auth = createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminSupabaseClient()
  const { data: session } = await admin
    .from('sessions')
    .select('id, scheduled_at, client_id, trainer_id, notes, users!client_id(name)')
    .eq('id', params.sessionId)
    .single()

  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  if (session.client_id !== user.id && session.trainer_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const clientName = (session.users as unknown as { name: string } | null)?.name ?? 'Client'
  const start = new Date(session.scheduled_at)

  const ics = buildIcs({
    uid: `session-${session.id}@fitpay`,
    title: 'FitPay training session',
    start,
    stamp: new Date(),
    details: session.notes
      ? `Training session with FitPay. Notes: ${session.notes}`
      : `Training session with FitPay${session.trainer_id === user.id ? ` — client: ${clientName}` : ''}.`,
  })

  return new NextResponse(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="fitpay-session-${session.id.slice(0, 8)}.ics"`,
    },
  })
}
