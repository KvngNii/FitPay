'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError || !data.user) {
      setError(authError?.message ?? 'Login failed')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .single()

    router.push(profile?.role === 'trainer' ? '/trainer/dashboard' : '/client/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(16,185,129,0.14), transparent), radial-gradient(ellipse 50% 40% at 80% 80%, rgba(20,184,166,0.07), transparent)',
        }}
      />

      <div className="relative w-full max-w-sm animate-fade-in-up">
        <div className="text-center mb-8">
          <span className="glow-text font-bold text-3xl tracking-tight">FitPay</span>
          <p className="text-slate-400 mt-2 text-sm">Sign in to your account</p>
        </div>

        <div className="card px-6 py-7">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password">Password</label>
                <Link href="/forgot-password" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <div className="pt-1">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            No account?{' '}
            <Link href="/signup" className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
