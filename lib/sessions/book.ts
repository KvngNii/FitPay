import type { SupabaseClient } from '@supabase/supabase-js'

type BookSessionInput = {
  client_id: string
  trainer_id: string
  scheduled_at: string
  notes?: string | null
}

type BookSessionResult =
  | { ok: true; session_id: string }
  | { ok: false; error: string }

// Shared booking logic used by both the authenticated /api/sessions/book
// route and the USSD callback (which has no Supabase auth session).
export async function bookSession(
  admin: SupabaseClient,
  { client_id, trainer_id, scheduled_at, notes }: BookSessionInput
): Promise<BookSessionResult> {
  const { data: purchase } = await admin
    .from('purchases')
    .select('id, sessions_left')
    .eq('client_id', client_id)
    .eq('status', 'active')
    .gt('sessions_left', 0)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (!purchase) {
    return { ok: false, error: 'Client has no active package with sessions remaining' }
  }

  const { data: clash } = await admin
    .from('sessions')
    .select('id')
    .eq('trainer_id', trainer_id)
    .eq('scheduled_at', scheduled_at)
    .eq('status', 'scheduled')
    .limit(1)
    .maybeSingle()

  if (clash) {
    return { ok: false, error: 'That time slot is already booked' }
  }

  const { data: session, error: sessionError } = await admin
    .from('sessions')
    .insert({
      client_id,
      trainer_id,
      purchase_id: purchase.id,
      scheduled_at,
      status: 'scheduled',
      notes: notes ?? null,
    })
    .select('id')
    .single()

  if (sessionError || !session) {
    console.error('Session insert error:', sessionError)
    return { ok: false, error: 'Failed to book session' }
  }

  await admin
    .from('purchases')
    .update({ sessions_left: purchase.sessions_left - 1 })
    .eq('id', purchase.id)

  const { data: client } = await admin.from('users').select('phone, name').eq('id', client_id).single()

  if (client?.phone) {
    const date = new Date(scheduled_at)
    const dateStr = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    const msg = `Hi ${client.name}! Your session is booked for ${dateStr} at ${timeStr}. See you then! Sent by FitPay`
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!
    fetch(`${appUrl}/api/sms/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: client.phone, message: msg.slice(0, 160) }),
    }).catch(() => {})
  }

  return { ok: true, session_id: session.id }
}
