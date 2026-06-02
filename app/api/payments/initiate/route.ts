import { NextRequest, NextResponse } from 'next/server'

// Initiates a Moolre mobile money collection for a package purchase.
// Server-side only — never expose API keys to client.
// Calls POST /payment/initiate on Moolre API.
// Creates a pending purchase row in DB before calling Moolre.
// Returns the Moolre payment URL / prompt for the client to complete payment.
export async function POST(_req: NextRequest) {
  return NextResponse.json({ status: 'ok', message: 'not implemented' })
}
