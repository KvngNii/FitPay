'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RotateCcw, CheckCircle } from 'lucide-react'

const NETWORKS = [
  { value: 'mtn', label: 'MTN MoMo' },
  { value: 'telecel', label: 'Telecel Cash' },
  { value: 'at', label: 'AirtelTigo Money' },
]

export default function ClientRefundButton({
  purchaseId,
  amount,
  packageName,
}: {
  purchaseId: string
  amount: number
  packageName: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [network, setNetwork] = useState('mtn')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleRefund(e: React.FormEvent) {
    e.preventDefault()
    if (!confirm(`Request a GH₵${amount} refund for "${packageName}" to your ${network.toUpperCase()} number?`)) return

    setLoading(true)
    setError(null)

    const res = await fetch('/api/disbursements/client-refund', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ purchase_id: purchaseId, network }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Refund request failed. Try again.')
      return
    }

    setDone(true)
    setOpen(false)
    router.refresh()
  }

  if (done) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-400 mt-2">
        <CheckCircle size={12} />
        Refund requested. Check your phone
      </div>
    )
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-2 flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
      >
        <RotateCcw size={12} />
        Request refund
      </button>
    )
  }

  return (
    <form onSubmit={handleRefund} className="mt-3 p-3 rounded-lg bg-slate-800/60 border border-slate-700 space-y-3">
      <p className="text-xs font-medium text-slate-300">
        Refund GH₵{amount} to your mobile money
      </p>
      <div>
        <label htmlFor={`network-${purchaseId}`} className="text-xs text-slate-400 mb-1 block">
          Select your network
        </label>
        <select
          id={`network-${purchaseId}`}
          value={network}
          onChange={(e) => setNetwork(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-50 w-full"
        >
          {NETWORKS.map((n) => (
            <option key={n.value} value={n.value}>{n.label}</option>
          ))}
        </select>
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-semibold text-sm py-2 rounded-lg transition-all disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Confirm refund'}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setError(null) }}
          className="px-4 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
