import { NextRequest, NextResponse } from 'next/server'

// Claude trigger 4 of 4: monthly personalised check-in messages.
// Fired via pg_cron on the 1st of each month for all active clients.
// Prompt includes: client name, goal, sessions completed this month, progress trend.
// Calls Claude with max_tokens: 100 (output must fit in 160-char SMS).
// Output: short personalised SMS message (max 160 chars).
// Delivers via Moolre SMS API through /api/sms/send.
// Processes clients in batches to avoid rate limits.
export async function POST(_req: NextRequest) {
  return NextResponse.json({ status: 'ok', message: 'not implemented' })
}
