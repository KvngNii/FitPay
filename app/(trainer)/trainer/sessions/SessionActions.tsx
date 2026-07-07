'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ClipboardCheck, AlertCircle } from 'lucide-react'

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

const TZ = 'Africa/Accra'

export function SessionCard({ session, isDue = false }: { session: SessionCardData; isDue?: boolean }) {
  const date = new Date(session.scheduled_at)
  const dateStr = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: TZ })
  const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: TZ })

  return (
    <div className={`card ${isDue ? 'border-amber-500/25' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-slate-50">{session.users?.name}</p>
          <p className="text-sm text-slate-400">{dateStr} · {timeStr}</p>
          {session.notes && <p className="text-xs text-slate-500 mt-0.5">{session.notes}</p>}
          {isDue && (
            <span className="mt-1.5 inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full">
              <AlertCircle size={11} />
              Ready to log
            </span>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          {isDue ? (
            <Link
              href="/trainer/log"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-950 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 px-3 py-1.5 rounded-lg transition-all"
            >
              <ClipboardCheck size={13} />
              Log &amp; complete
            </Link>
          ) : (
            <Link href="/trainer/log" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
              Log
            </Link>
          )}
          <CancelButton sessionId={session.id} />
        </div>
      </div>
    </div>
  )
}
