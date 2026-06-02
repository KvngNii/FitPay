import { NextResponse } from 'next/server'

// Polls Moolre for payment status by moolre_ref.
// Calls POST /payment/status on Moolre API.
// Used for manual status checks — normal flow uses the webhook.
export async function POST() {
  return NextResponse.json({ status: 'ok', message: 'not implemented' })
}
