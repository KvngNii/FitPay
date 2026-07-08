import { NextResponse } from 'next/server'

// Shared secret for server-to-server calls between our own API routes
// (webhook/cron/route → sms, ai, engine). These endpoints are never called
// directly by a browser, so we gate them on a header only our server knows.
// Fail closed: if the secret is unset, internal calls are rejected.
export function internalHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-internal-secret': process.env.INTERNAL_API_SECRET ?? '',
  }
}

export function isInternalRequest(req: Request): boolean {
  const secret = process.env.INTERNAL_API_SECRET
  if (!secret) return false
  return req.headers.get('x-internal-secret') === secret
}

// Returns a 401 response if the request is not an authenticated internal call,
// otherwise null.
export function rejectIfNotInternal(req: Request): NextResponse | null {
  if (isInternalRequest(req)) return null
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
