import { NextResponse } from 'next/server'

// Cancels a scheduled session.
// Updates session status to 'cancelled'.
// Returns sessions_left to the purchase if cancelled within policy window.
// Sends cancellation SMS to client.
// Trainer or client can cancel (with appropriate RLS check).
export async function POST() {
  return NextResponse.json({ status: 'ok', message: 'not implemented' })
}
