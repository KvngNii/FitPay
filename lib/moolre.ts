// Server-only — never import this from a client component.
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

// Sandbox note: X-API-KEY and X-API-PUBKEY are not required in sandbox —
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
  // Sandbox only checks X-API-USER — sending the pubkey causes a Token.php crash
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

// Use for: SMS sending (requires VAS key, separate from main keys)
export async function moolreSms<T = unknown>(
  body: Record<string, unknown>
): Promise<MoolreResponse<T>> {
  const vasKey = IS_SANDBOX
    ? process.env.MOOLRE_SANDBOX_VAS_KEY!
    : process.env.MOOLRE_VAS_KEY!

  const res = await fetch(`${BASE_URL}/open/sms/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-VASKEY': vasKey,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Moolre SMS HTTP ${res.status}`)
  return res.json() as Promise<MoolreResponse<T>>
}

export const MOOLRE_ACCOUNT = process.env.MOOLRE_ACCOUNT_NUMBER!
