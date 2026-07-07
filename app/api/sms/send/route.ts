import { NextRequest, NextResponse } from 'next/server'
import { moolreSms } from '@/lib/moolre'

// Sends a single SMS via Moolre SMS API.
// Called internally by webhook and pg_cron - not exposed to clients directly.
// Body: { to: string, message: string }
export async function POST(req: NextRequest) {
  const { to, message } = await req.json()

  if (!to || !message) {
    return NextResponse.json({ error: 'to and message are required' }, { status: 400 })
  }

  if (message.length > 160) {
    return NextResponse.json({ error: 'message exceeds 160 characters' }, { status: 400 })
  }

  const senderid = process.env.MOOLRE_SENDER_ID ?? 'FitPay'

  const result = await moolreSms({
    type: 1,
    senderid,
    messages: [{ recipient: to, message }],
  })

  return NextResponse.json(result)
}
