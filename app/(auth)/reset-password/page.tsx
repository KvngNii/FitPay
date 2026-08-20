'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()

  const [checkingSession, setCheckingSession] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  // The /auth/callback route already exchanged the recovery code for a
  // session before redirecting here — just confirm one exists.
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session)
      setCheckingSession(false)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setDone(true)
    await supabase.auth.signOut()
    setTimeout(() => router.push('/login'), 2000)
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
          <p className="text-slate-400 mt-2 text-sm">Set a new password</p>
        </div>

        <div className="card px-6 py-7">
          {checkingSession ? (
            <p className="text-slate-400 text-sm text-center">Checking your link...</p>
          ) : done ? (
            <div className="text-center space-y-2">
              <p className="text-emerald-400 font-medium">Password updated</p>
              <p className="text-slate-400 text-sm">Taking you to sign in...</p>
            </div>
          ) : !hasSession ? (
            <div className="text-center space-y-4">
              <p className="text-slate-300 text-sm">
                This reset link is invalid or has expired.
              </p>
              <Link href="/forgot-password" className="btn-primary inline-block">
                Request a new link
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password">New password</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label htmlFor="confirm">Confirm password</label>
                <input
                  id="confirm"
                  type="password"
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>

              {error && <p className="text-red-400 text-sm text-center">{error}</p>}

              <div className="pt-1">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Updating...' : 'Update password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
