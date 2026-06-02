import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Unauthenticated users can only access auth routes
  if (!user) {
    if (
      pathname.startsWith('/client') ||
      pathname.startsWith('/trainer')
    ) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return supabaseResponse
  }

  // Fetch role from users table
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role

  // Trainer-only routes
  if (pathname.startsWith('/trainer') && role !== 'trainer') {
    return NextResponse.redirect(new URL('/client/dashboard', request.url))
  }

  // Client-only routes
  if (pathname.startsWith('/client') && role !== 'client') {
    return NextResponse.redirect(new URL('/trainer/dashboard', request.url))
  }

  // Redirect authenticated users away from auth pages to their dashboard
  if (pathname === '/login' || pathname === '/signup') {
    const dest =
      role === 'trainer' ? '/trainer/dashboard' : '/client/dashboard'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
