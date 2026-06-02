import { NextResponse } from 'next/server'

// Initiates a trainer withdrawal via Moolre transfer API.
// Trainer-only — verify role before processing.
// Calls POST /transfer/initiate on Moolre API.
// Creates a disbursements row with status 'pending'.
// Webhook updates status to 'success' or 'failed'.
export async function POST() {
  return NextResponse.json({ status: 'ok', message: 'not implemented' })
}
