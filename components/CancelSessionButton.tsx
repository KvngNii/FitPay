'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { XCircle } from 'lucide-react'

// Lets a client cancel one of their own upcoming (not-yet-happened) sessions.
// The session credit returns to their package, making it eligible for a
// refund request from the Packages page afterwards.
export default function CancelSessionButton({ sessionId }: { sessionId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCancel() {
    if (!confirm('Cancel this session? Your session credit will be returned, and you can request a refund for it from Packages if you like.')) return
    setLoading(true)
    setError(null)

    const res = await fetch('/api/sessions/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId }),
    })
    const data = await res.json().catch(() => ({}))
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Could not cancel this session. Try again.')
      return
    }
    router.refresh()
  }

  return (
    <div>
      <button
        onClick={handleCancel}
        disabled={loading}
        className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
      >
        <XCircle size={13} />
        {loading ? 'Cancelling…' : 'Cancel session'}
      </button>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  )
}
