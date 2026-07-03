'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const NETWORKS = [
  { value: 'mtn', label: 'MTN MoMo' },
  { value: 'telecel', label: 'Telecel Cash' },
  { value: 'at', label: 'AirtelTigo Money' },
]

export default function RefundButton({ purchaseId, amount }: { purchaseId: string; amount: number }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [network, setNetwork] = useState('mtn')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRefund(e: React.FormEvent) {
    e.preventDefault()
    if (!confirm(`Refund GH₵${amount} to this client via ${network.toUpperCase()}?`)) return

    setLoading(true)
    setError(null)

    const res = await fetch('/api/disbursements/refund', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ purchase_id: purchaseId, network }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Refund failed. Try again.')
      return
    }

    setOpen(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-red-400 hover:text-red-300">
        Refund
      </button>
    )
  }

  return (
    <form onSubmit={handleRefund} className="flex items-center gap-2 mt-2">
      <select
        value={network}
        onChange={(e) => setNetwork(e.target.value)}
        className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-50"
      >
        {NETWORKS.map((n) => (
          <option key={n.value} value={n.value}>{n.label}</option>
        ))}
      </select>
      <button type="submit" disabled={loading} className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50">
        {loading ? 'Refunding…' : 'Confirm'}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-xs text-slate-500 hover:text-slate-300">
        Cancel
      </button>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </form>
  )
}
