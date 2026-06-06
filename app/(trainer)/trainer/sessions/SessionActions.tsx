'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function CancelButton({ sessionId }: { sessionId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleCancel() {
    if (!confirm('Cancel this session? The credit will be returned to the client.')) return
    setLoading(true)
    await fetch('/api/sessions/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId }),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={handleCancel}
      disabled={loading}
      className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
    >
      {loading ? 'Cancelling…' : 'Cancel'}
    </button>
  )
}

export function SessionCard({ session }: { session: any }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [difficulty, setDifficulty] = useState<'easy' | 'moderate' | 'hard'>('moderate')
  const [injuryFlag, setInjuryFlag] = useState(false)
  const [injuryNotes, setInjuryNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const date = new Date(session.scheduled_at)
  const dateStr = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  async function handleComplete(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/sessions/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: session.id,
        exercises: [],
        overall_difficulty: difficulty,
        injury_flag: injuryFlag,
        injury_notes: injuryFlag ? injuryNotes : null,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Failed to complete session')
      return
    }

    setOpen(false)
    router.refresh()
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-slate-50">{session.users?.name}</p>
          <p className="text-sm text-slate-400">{dateStr} · {timeStr}</p>
          {session.notes && <p className="text-xs text-slate-500 mt-0.5">{session.notes}</p>}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setOpen(!open)}
            className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            {open ? 'Hide' : 'Complete'}
          </button>
          <CancelButton sessionId={session.id} />
        </div>
      </div>

      {open && (
        <form onSubmit={handleComplete} className="mt-3 pt-3 border-t border-slate-800 space-y-3">
          <div>
            <p className="text-xs font-medium text-slate-400 mb-1">Session difficulty</p>
            <div className="flex gap-2">
              {(['easy', 'moderate', 'hard'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={`text-xs px-3 py-1.5 rounded-lg border capitalize transition-colors ${
                    difficulty === d
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                      : 'border-slate-700 text-slate-400'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={injuryFlag}
              onChange={(e) => setInjuryFlag(e.target.checked)}
              className="w-4 h-4 rounded accent-emerald-500"
            />
            <span className="text-sm text-slate-300">Client reported injury</span>
          </label>

          {injuryFlag && (
            <input
              type="text"
              placeholder="Describe the injury"
              value={injuryNotes}
              onChange={(e) => setInjuryNotes(e.target.value)}
              required
            />
          )}

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary py-2 text-sm">
            {loading ? 'Saving…' : 'Mark Complete'}
          </button>
        </form>
      )}
    </div>
  )
}
