import { NextResponse } from 'next/server'

// Processes a client refund via Moolre transfer API.
// Trainer-only — verify role before processing.
// Calls POST /transfer/initiate on Moolre API with type 'refund'.
// Updates purchase status to 'refunded'.
// Creates a disbursements row of type 'refund'.
export async function POST() {
  return NextResponse.json({ status: 'ok', message: 'not implemented' })
}
