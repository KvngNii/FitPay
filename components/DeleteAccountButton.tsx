'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function DeleteAccountButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setLoading(true)
    setError(null)

    const res = await fetch('/api/account/delete', { method: 'POST' })
    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      setError(data.error ?? 'Could not delete your account. Try again.')
      setLoading(false)
      return
    }

    // Clear the local session, then leave.
    try {
      await createClient().auth.signOut()
    } catch {
      // ignore - the account is already gone server-side
    }
    router.push('/signup')
  }

  return (
    <div className="mt-10 pt-6 border-t border-red-900/40">
      <div className="flex items-center gap-2 mb-1">
        <AlertTriangle size={15} className="text-red-400" />
        <p className="text-sm font-semibold text-red-400">Danger zone</p>
      </div>
      <p className="text-xs text-slate-500 mb-3">
        Deleting your account is permanent. Your sessions, packages, plans and history are erased and cannot be recovered.
      </p>

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 border border-red-900/50 hover:border-red-700 rounded-lg px-4 py-2.5 transition-colors"
        >
          <Trash2 size={15} />
          Delete my account
        </button>
      ) : (
        <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-4 space-y-3">
          <p className="text-sm text-slate-300">
            Type <span className="font-semibold text-red-400">DELETE</span> to confirm.
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            className="!bg-slate-900"
            autoComplete="off"
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={loading || confirmText !== 'DELETE'}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Deleting…' : 'Permanently delete'}
            </button>
            <button
              onClick={() => { setOpen(false); setError(null); setConfirmText('') }}
              disabled={loading}
              className="px-4 text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
