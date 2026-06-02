import { NextRequest, NextResponse } from 'next/server'

// Receives payment status change webhooks from Moolre.
// Must be idempotent: check moolre_ref before processing.
// Always return HTTP 200 — even for duplicates.
// Flow: extract moolre_ref → check purchases table → if exists return 200 → else process + insert.
export async function POST(_req: NextRequest) {
  return NextResponse.json({ status: 'ok', message: 'not implemented' })
}
