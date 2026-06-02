// Server-only — never import this from a client component.
// All Moolre API calls must go through this module.
import type { MoolreResponse } from '@/types'

const BASE_URL =
  process.env.USE_SANDBOX === 'true'
    ? 'https://sandbox.moolre.com'
    : 'https://api.moolre.com'

const API_USER =
  process.env.USE_SANDBOX === 'true'
    ? process.env.MOOLRE_SANDBOX_API_USER!
    : process.env.MOOLRE_API_USER!

const API_KEY =
  process.env.USE_SANDBOX === 'true'
    ? process.env.MOOLRE_SANDBOX_API_KEY!
    : process.env.MOOLRE_API_KEY!

export async function moolreFetch<T = unknown>(
  path: string,
  body: Record<string, unknown>
): Promise<MoolreResponse<T>> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-USER': API_USER,
      'X-API-KEY': API_KEY,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`Moolre HTTP error: ${response.status}`)
  }

  return response.json() as Promise<MoolreResponse<T>>
}
