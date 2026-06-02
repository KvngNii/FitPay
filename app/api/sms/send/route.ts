import { NextRequest, NextResponse } from 'next/server'

// Sends an SMS via Moolre SMS API.
// Called by pg_cron database function for scheduled reminders.
// Also called directly for booking confirmations and one-off messages.
// Calls POST /sms/send on Moolre API with fields: to, message, sender_id.
// Server-side only.
export async function POST(_req: NextRequest) {
  return NextResponse.json({ status: 'ok', message: 'not implemented' })
}
