import { NextRequest, NextResponse } from 'next/server'
import { moolreSms } from '@/lib/moolre'
import { rejectIfNotInternal } from '@/lib/internal'

// Sends a single SMS via Moolre SMS API.
// Internal only — server-to-server calls must carry the internal secret so this
// cannot be abused as an open SMS relay under our sender ID.
// Body: { to: string, message: string }
export async function POST(req: NextRequest) {
  const blocked = rejectIfNotInternal(req)
  if (blocked) return blocked

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
