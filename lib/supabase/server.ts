import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// For server components, server actions, and API routes.
// Uses service role key — bypasses RLS. Never import this on the client.
export function createServerSupabaseClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from a Server Component — safe to ignore
          }
        },
      },
    }
  )
}

// For use in middleware where we need auth session reads (anon key + RLS).
export function createMiddlewareSupabaseClient(
  request: Request,
  response: Response
) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return (request as any).cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            (request as any).cookies.set(name, value)
          )
          cookiesToSet.forEach(({ name, value, options }) =>
            (response as any).cookies.set(name, value, options)
          )
        },
      },
    }
  )
}
