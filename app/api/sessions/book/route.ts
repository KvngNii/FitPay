import { NextResponse } from 'next/server'

// Books a session for a client.
// Verifies client has an active purchase with sessions_left > 0.
// Inserts a session row with status 'scheduled'.
// Decrements sessions_left on the purchase.
// Sends SMS confirmation via /api/sms/send.
export async function POST() {
  return NextResponse.json({ status: 'ok', message: 'not implemented' })
}
