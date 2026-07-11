// Server-only - never import this from a client component.
// All Moolre API calls must go through this module.
import type { MoolreResponse } from '@/types'

const IS_SANDBOX = process.env.USE_SANDBOX === 'true'

const BASE_URL = IS_SANDBOX
  ? 'https://sandbox.moolre.com'
  : 'https://api.moolre.com'

const API_USER = IS_SANDBOX
  ? process.env.MOOLRE_SANDBOX_API_USER!
  : process.env.MOOLRE_API_USER!

const API_KEY = IS_SANDBOX
  ? process.env.MOOLRE_SANDBOX_API_KEY!
  : process.env.MOOLRE_API_KEY!

const API_PUBKEY = IS_SANDBOX
  ? process.env.MOOLRE_SANDBOX_API_PUBKEY!
  : process.env.MOOLRE_API_PUBKEY!

// Sandbox note: X-API-KEY and X-API-PUBKEY are not required in sandbox -
// only X-API-USER is checked. We still send them for parity with production.
function baseHeaders() {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-API-USER': API_USER,
  }
  if (!IS_SANDBOX) headers['X-API-KEY'] = API_KEY
  return headers
}

function pubHeaders() {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-API-USER': API_USER,
  }
  // Sandbox only checks X-API-USER - sending the pubkey causes a Token.php crash
  if (!IS_SANDBOX) headers['X-API-PUBKEY'] = API_PUBKEY
  return headers
}

// Use for: payment initiation, transfers (requires private key)
export async function moolrePost<T = unknown>(
  path: string,
  body: Record<string, unknown>
): Promise<MoolreResponse<T>> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: baseHeaders(),
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Moolre HTTP ${res.status} on ${path}`)
  return res.json() as Promise<MoolreResponse<T>>
}

// Use for: status checks, payment links (requires public key)
export async function moolrePostPub<T = unknown>(
  path: string,
  body: Record<string, unknown>
): Promise<MoolreResponse<T>> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: pubHeaders(),
    body: JSON.stringify(body),
  })
  const rawText = await res.text()
  if (!res.ok) throw new Error(`Moolre HTTP ${res.status} on ${path}`)
  return JSON.parse(rawText) as MoolreResponse<T>
}

// SMS (and USSD) travel over GSM networks, which only support the GSM 7-bit
// default alphabet - a much narrower set than UTF-8. Characters outside it
// (curly quotes, em/en dashes, an ellipsis glyph, the ₵ sign, etc.) either get
// silently corrupted by the gateway or force the whole message into UCS-2
// encoding, which cuts the character budget from 160 to 70 and can truncate
// mid-word. Prompts and templates are written GSM-safe already; this is the
// last line of defense in case one slips through.
const GSM_UNSAFE_REPLACEMENTS: [RegExp, string][] = [
  [/[–—]/g, '-'],   // en dash, em dash -> hyphen
  [/[‘’]/g, "'"],   // curly single quotes -> straight
  [/[“”]/g, '"'],   // curly double quotes -> straight
  [/…/g, '...'],         // ellipsis glyph -> three periods
  [/₵/g, 'GHS'],         // cedi sign -> GHS
]

export function toGsmSafe(text: string): string {
  return GSM_UNSAFE_REPLACEMENTS.reduce((s, [pattern, repl]) => s.replace(pattern, repl), text)
}

function sanitizeSmsBody(body: Record<string, unknown>): Record<string, unknown> {
  const messages = body.messages
  if (!Array.isArray(messages)) return body
  return {
    ...body,
    messages: messages.map((m) =>
      m && typeof m === 'object' && typeof (m as { message?: unknown }).message === 'string'
        ? { ...m, message: toGsmSafe((m as { message: string }).message) }
        : m
    ),
  }
}

// Use for: SMS sending (requires VAS key, separate from main keys).
// SMS always uses production keys - sandbox mode does not deliver real messages
// to real phones, so there is no meaningful sandbox for SMS.
export async function moolreSms<T = unknown>(
  body: Record<string, unknown>
): Promise<MoolreResponse<T>> {
  const vasKey = process.env.MOOLRE_VAS_KEY!
  const safeBody = sanitizeSmsBody(body)

  const res = await fetch('https://api.moolre.com/open/sms/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-VASKEY': vasKey,
    },
    body: JSON.stringify(safeBody),
  })

  const rawText = await res.text()
  console.log('[moolreSms] status:', res.status, 'body:', rawText)

  if (!res.ok) throw new Error(`Moolre SMS HTTP ${res.status}: ${rawText}`)

  const json = JSON.parse(rawText) as MoolreResponse<T>
  // Moolre returns HTTP 200 even for application-level errors (e.g. ASMS07 unapproved sender ID)
  if (json.status !== 1) {
    throw new Error(`Moolre SMS error ${json.code ?? 'unknown'}: ${json.message ?? rawText}`)
  }
  return json
}

export const MOOLRE_ACCOUNT = process.env.MOOLRE_ACCOUNT_NUMBER!
