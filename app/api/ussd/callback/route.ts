import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { waitUntil } from '@vercel/functions'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { moolrePostPub, moolreSms, MOOLRE_ACCOUNT } from '@/lib/moolre'
import { bookSession } from '@/lib/sessions/book'
import type { UssdRequest, UssdResponse, ExerciseEntry, MoolrePaymentLinkData } from '@/types'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// Preflight - needed by the Moolre browser-based USSD simulator
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

const SESSION_TTL_MS = 3 * 60 * 1000

const DAY_OPTIONS = [1, 2, 3, 4, 5]
const TIME_OPTIONS = [
  { hour: 6, label: '6:00 AM' },
  { hour: 8, label: '8:00 AM' },
  { hour: 12, label: '12:00 PM' },
  { hour: 16, label: '4:00 PM' },
  { hour: 18, label: '6:00 PM' },
]

type SessionData = {
  day_offset?: number
  package_ids?: string[]
}

function reply(message: string, keepGoing: boolean): NextResponse {
  return NextResponse.json(
    { message: message.slice(0, 160), reply: keepGoing } satisfies UssdResponse,
    { headers: CORS_HEADERS }
  )
}

// Local Ghana numbers are stored as 0XXXXXXXXX; Moolre sends msisdn as 233XXXXXXXXX.
function toLocalPhone(msisdn: string): string {
  const digits = msisdn.replace(/\D/g, '')
  return digits.startsWith('233') ? `0${digits.slice(3)}` : digits
}

// Moolre SMS API expects international format 233XXXXXXXXX.
function toInternationalPhone(local: string): string {
  const digits = local.replace(/\D/g, '')
  return digits.startsWith('0') ? `233${digits.slice(1)}` : digits
}

function mainMenuText(): string {
  return 'FitPay\n1. Book a session\n2. View my plan\n3. Session balance\n4. Buy sessions\n0. Exit'
}

export async function POST(req: NextRequest) {
  let body: UssdRequest
  try {
    body = await req.json()
  } catch {
    return reply('Invalid request.', false)
  }

  const sessionId = typeof body.sessionId === 'string' ? body.sessionId : ''
  const msisdn = typeof body.msisdn === 'string' ? body.msisdn : ''
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  const isNew = body.new === true || body.new === 'true' || body.new === 1

  if (!sessionId || !msisdn) {
    return reply('Invalid request.', false)
  }

  const admin = createAdminSupabaseClient()
  const phone = toLocalPhone(msisdn)
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString()

  if (isNew) {
    const { data: client } = await admin.from('users').select('id').eq('phone', phone).eq('role', 'client').single()

    if (!client) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
      return reply(`No FitPay account found for this number. Sign up at ${appUrl}/signup`, false)
    }

    const { error: upsertError } = await admin.from('ussd_sessions').upsert({
      session_id: sessionId,
      phone,
      client_id: client.id,
      current_state: 'main_menu',
      session_data: {},
      expires_at: expiresAt,
    })

    if (upsertError) {
      console.error('USSD session upsert error:', JSON.stringify(upsertError))
      return reply('Service error. Please try again.', false)
    }

    return reply(mainMenuText(), true)
  }

  const { data: ussdSession } = await admin
    .from('ussd_sessions')
    .select('client_id, current_state, session_data')
    .eq('session_id', sessionId)
    .single()

  if (!ussdSession || !ussdSession.client_id) {
    return reply('Session expired. Please dial again.', false)
  }

  const clientId = ussdSession.client_id
  const state = ussdSession.current_state
  const data = (ussdSession.session_data ?? {}) as SessionData

  async function endSession(text: string) {
    await admin.from('ussd_sessions').delete().eq('session_id', sessionId)
    return reply(text, false)
  }

  async function transition(nextState: string, nextData: SessionData, text: string) {
    await admin
      .from('ussd_sessions')
      .update({ current_state: nextState, session_data: nextData, expires_at: expiresAt })
      .eq('session_id', sessionId)
    return reply(text, true)
  }

  if (state === 'main_menu') {
    if (message === '1') {
      const { data: purchase } = await admin
        .from('purchases')
        .select('sessions_left')
        .eq('client_id', clientId)
        .eq('status', 'active')
        .gt('sessions_left', 0)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (!purchase) {
        return endSession('You have no sessions remaining. Reply 4 from the FitPay menu to buy sessions.')
      }

      const menu = DAY_OPTIONS.map((d, i) => `${i + 1}. In ${d} day${d > 1 ? 's' : ''}`).join('\n')
      return transition('book_day', {}, `Choose a day:\n${menu}\n0. Back`)
    }

    if (message === '2') {
      const [{ data: rule }, { data: recentSessions }] = await Promise.all([
        admin.from('progression_rules').select('initial_plan').eq('client_id', clientId).maybeSingle(),
        admin
          .from('sessions')
          .select('id')
          .eq('client_id', clientId)
          .eq('status', 'completed')
          .order('scheduled_at', { ascending: false })
          .limit(5),
      ])

      const sessionIds = recentSessions?.map((s) => s.id) ?? []
      let latestPlan: ExerciseEntry[] | null = null

      if (sessionIds.length > 0) {
        const { data: latestLog } = await admin
          .from('workout_logs')
          .select('next_plan')
          .in('session_id', sessionIds)
          .not('next_plan', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        latestPlan = (latestLog?.next_plan as ExerciseEntry[] | null) ?? null
      }

      const plan = latestPlan ?? (rule?.initial_plan as ExerciseEntry[] | null)
      if (!plan || plan.length === 0) {
        return endSession("Your plan isn't ready yet. Check back after your first session.")
      }

      const lines = plan.slice(0, 4).map((ex, i) => `${i + 1}. ${ex.name} · ${ex.sets}x${ex.reps}`)
      return endSession(`Your next session:\n${lines.join('\n')}`)
    }

    if (message === '3') {
      const { data: purchase } = await admin
        .from('purchases')
        .select('sessions_left')
        .eq('client_id', clientId)
        .eq('status', 'active')
        .gt('sessions_left', 0)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      const left = purchase?.sessions_left ?? 0
      return endSession(`You have ${left} session${left !== 1 ? 's' : ''} remaining.`)
    }

    if (message === '4') {
      const { data: packages } = await admin
        .from('packages')
        .select('id, name, price_ghs')
        .eq('is_active', true)
        .order('price_ghs', { ascending: true })

      if (!packages || packages.length === 0) {
        return endSession('No packages available right now.')
      }

      const menu = packages.map((p, i) => `${i + 1}. ${p.name} · GH₵${p.price_ghs}`).join('\n')
      return transition('buy_package', { package_ids: packages.map((p) => p.id) }, `Buy sessions:\n${menu}\n0. Back`)
    }

    if (message === '0') {
      return endSession('Goodbye!')
    }

    return endSession('Invalid option. Goodbye.')
  }

  if (state === 'book_day') {
    if (message === '0') {
      return transition('main_menu', {}, mainMenuText())
    }

    const idx = Number(message) - 1
    if (!Number.isInteger(idx) || idx < 0 || idx >= DAY_OPTIONS.length) {
      return endSession('Invalid option. Goodbye.')
    }

    const dayOffset = DAY_OPTIONS[idx]
    const menu = TIME_OPTIONS.map((t, i) => `${i + 1}. ${t.label}`).join('\n')
    return transition('book_time', { day_offset: dayOffset }, `Choose a time:\n${menu}\n0. Back`)
  }

  if (state === 'book_time') {
    if (message === '0') {
      const menu = DAY_OPTIONS.map((d, i) => `${i + 1}. In ${d} day${d > 1 ? 's' : ''}`).join('\n')
      return transition('book_day', {}, `Choose a day:\n${menu}\n0. Back`)
    }

    const idx = Number(message) - 1
    if (!Number.isInteger(idx) || idx < 0 || idx >= TIME_OPTIONS.length || !data.day_offset) {
      return endSession('Invalid option. Goodbye.')
    }

    const scheduled = new Date()
    scheduled.setUTCDate(scheduled.getUTCDate() + data.day_offset)
    scheduled.setUTCHours(TIME_OPTIONS[idx].hour, 0, 0, 0)

    const { data: bookingClient } = await admin.from('users').select('trainer_id').eq('id', clientId).single()
    if (!bookingClient?.trainer_id) {
      return endSession('No trainer is assigned to your account yet. Try again later.')
    }

    const result = await bookSession(admin, {
      client_id: clientId,
      trainer_id: bookingClient.trainer_id,
      scheduled_at: scheduled.toISOString(),
    })

    if (!result.ok) {
      return endSession(result.error)
    }

    const dateStr = scheduled.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    return endSession(`Session booked for ${dateStr} at ${TIME_OPTIONS[idx].label}! You'll get an SMS confirmation.`)
  }

  if (state === 'buy_package') {
    if (message === '0') {
      return transition('main_menu', {}, mainMenuText())
    }

    const idx = Number(message) - 1
    const packageIds = data.package_ids ?? []
    if (!Number.isInteger(idx) || idx < 0 || idx >= packageIds.length) {
      return endSession('Invalid option. Goodbye.')
    }

    const packageId = packageIds[idx]
    const [{ data: pkg }, { data: client }] = await Promise.all([
      admin.from('packages').select('id, name, sessions, price_ghs, duration_days').eq('id', packageId).single(),
      admin.from('users').select('phone, email, name, trainer_id').eq('id', clientId).single(),
    ])

    if (!pkg || !client) {
      return endSession('That package is no longer available.')
    }

    const externalref = randomUUID()
    const expiry = new Date()
    expiry.setDate(expiry.getDate() + pkg.duration_days)

    const { error: insertError } = await admin.from('purchases').insert({
      client_id: clientId,
      trainer_id: client.trainer_id,
      package_id: pkg.id,
      moolre_ref: externalref,
      status: 'pending',
      sessions_left: pkg.sessions,
      expires_at: expiry.toISOString(),
    })

    if (insertError) {
      console.error('USSD purchase insert error:', insertError)
      return endSession('Could not start payment. Try again later.')
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!
    let moolreRes
    try {
      moolreRes = await moolrePostPub<MoolrePaymentLinkData>('/embed/link', {
        type: 1,
        amount: String(pkg.price_ghs),
        email: client.email ?? `client-${clientId.slice(0, 8)}@fitpay.app`,
        externalref,
        callback: `${appUrl}/api/webhooks/moolre`,
        redirect: `${appUrl}/client/packages?payment=success`,
        reusable: '0',
        expiration_time: 30,
        currency: 'GHS',
        accountnumber: MOOLRE_ACCOUNT,
        metadata: { package_id: pkg.id, client_id: clientId, package_name: pkg.name },
      })
    } catch (err) {
      console.error('USSD Moolre call failed:', err)
      await admin.from('purchases').delete().eq('moolre_ref', externalref)
      return endSession('Payment service unavailable. Try again later.')
    }

    if (moolreRes.status !== 1 || !moolreRes.data?.authorization_url) {
      await admin.from('purchases').delete().eq('moolre_ref', externalref)
      return endSession('Could not start payment. Try again later.')
    }

    // Send SMS after the USSD response is returned - avoids the 5-second telco timeout.
    // waitUntil keeps the Vercel function alive until the SMS call completes.
    if (client.phone) {
      const senderid = process.env.MOOLRE_SENDER_ID ?? 'FitPay'
      const smsMsg = `FitPay payment link: ${moolreRes.data.authorization_url}`.slice(0, 160)
      const smsRecipient = toInternationalPhone(client.phone)
      waitUntil(
        moolreSms({
          type: 1,
          senderid,
          messages: [{ recipient: smsRecipient, message: smsMsg }],
        }).catch((err) => console.error('USSD SMS send failed:', err))
      )
    }

    return endSession('Payment link sent via SMS. Complete payment to activate your sessions.')
  }

  return endSession('Session expired. Please dial again.')
}
