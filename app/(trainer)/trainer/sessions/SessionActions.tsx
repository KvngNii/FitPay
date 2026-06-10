'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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

type SessionCardData = {
  id: string
  scheduled_at: string
  notes: string | null
  users: { name: string } | null
}

export function SessionCard({ session }: { session: SessionCardData }) {
  const date = new Date(session.scheduled_at)
  const dateStr = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="card flex items-center justify-between">
      <div>
        <p className="font-medium text-slate-50">{session.users?.name}</p>
        <p className="text-sm text-slate-400">{dateStr} · {timeStr}</p>
        {session.notes && <p className="text-xs text-slate-500 mt-0.5">{session.notes}</p>}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Link href="/trainer/log" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
          Log
        </Link>
        <CancelButton sessionId={session.id} />
      </div>
    </div>
  )
}
