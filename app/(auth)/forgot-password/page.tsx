'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  // Surface a friendlier message if we bounced back here from an expired recovery link.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('error') === 'expired') {
      setError('That reset link has expired. Request a new one below.')
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

    setLoading(false)

    // Always show success, even if the email doesn't exist — avoids leaking
    // which emails have an account.
    if (resetError) {
      setError(resetError.message)
      return
    }
    setSent(true)
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
          <p className="text-slate-400 mt-2 text-sm">Reset your password</p>
        </div>

        <div className="card px-6 py-7">
          {sent ? (
            <div className="text-center space-y-3">
              <p className="text-emerald-400 font-medium">Check your email</p>
              <p className="text-slate-400 text-sm">
                If an account exists for <span className="text-slate-300">{email}</span>, a password reset link is on its way.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-slate-400 text-sm -mt-1">
                Enter the email on your account and we&apos;ll send you a link to reset your password.
              </p>

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

              {error && <p className="text-red-400 text-sm text-center">{error}</p>}

              <div className="pt-1">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Sending...' : 'Send reset link'}
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-sm text-slate-500 mt-5">
            <Link href="/login" className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
