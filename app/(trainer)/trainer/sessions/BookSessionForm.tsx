'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Client = { id: string; name: string; sessions_left: number; package_name: string }

export default function BookSessionForm({ clients }: { clients: Client[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [clientId, setClientId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleBook(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const scheduled_at = new Date(`${date}T${time}`).toISOString()

    const res = await fetch('/api/sessions/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, scheduled_at, notes: notes || null }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Failed to book session')
      return
    }

    setOpen(false)
    setClientId('')
    setDate('')
    setTime('')
    setNotes('')
    router.refresh()
  }

  if (clients.length === 0) return null

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary mb-6">
        + Book Session
      </button>
    )
  }

  return (
    <form onSubmit={handleBook} className="card mb-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-50">Book a Session</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-300 text-sm">
          Cancel
        </button>
      </div>

      <div>
        <label htmlFor="client">Client</label>
        <select id="client" value={clientId} onChange={(e) => setClientId(e.target.value)} required>
          <option value="">Select a client</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} — {c.sessions_left} sessions left ({c.package_name})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="date">Date</label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            required
          />
        </div>
        <div>
          <label htmlFor="time">Time</label>
          <input
            id="time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="notes">Notes (optional)</label>
        <input
          id="notes"
          type="text"
          placeholder="e.g. Bring resistance bands"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? 'Booking…' : 'Book Session'}
      </button>
    </form>
  )
}
