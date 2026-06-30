'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BookForm({ sessionsLeft }: { sessionsLeft: number }) {
  const router = useRouter()
  const [scheduledAt, setScheduledAt] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!scheduledAt) return

    setLoading(true)
    setError(null)

    const res = await fetch('/api/sessions/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduled_at: new Date(scheduledAt).toISOString(), notes: notes || null }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Could not book session. Try again.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    router.refresh()
  }

  if (sessionsLeft <= 0) {
    return (
      <div className="card text-center py-8">
        <p className="text-slate-400 text-sm">You have no sessions remaining on your package.</p>
      </div>
    )
  }

  if (success) {
    return (
      <div className="card text-center py-8">
        <p className="text-emerald-400 font-medium">Session booked!</p>
        <p className="text-slate-400 text-sm mt-1">You&apos;ll get an SMS confirmation shortly.</p>
        <button
          onClick={() => { setSuccess(false); setScheduledAt(''); setNotes('') }}
          className="text-sm text-emerald-400 mt-4 hover:text-emerald-300"
        >
          Book another session
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <div>
        <label className="block text-sm text-slate-400 mb-1.5">Date &amp; time</label>
        <input
          type="datetime-local"
          required
          min={new Date().toISOString().slice(0, 16)}
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="input"
        />
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-1.5">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Anything your trainer should know"
          className="input resize-none"
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Booking…' : 'Book Session'}
      </button>

      <p className="text-xs text-slate-500 text-center">{sessionsLeft} session{sessionsLeft !== 1 ? 's' : ''} remaining</p>
    </form>
  )
}
