import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// Handles the redirect from Supabase auth emails (password recovery, etc).
// Exchanges the one-time `code` for a session, then forwards to `next`.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const next = req.nextUrl.searchParams.get('next') ?? '/reset-password'

  if (code) {
    const supabase = createServerSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(new URL('/forgot-password?error=expired', req.url))
    }
  }

  return NextResponse.redirect(new URL(next, req.url))
}
