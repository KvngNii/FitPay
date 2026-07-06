'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RotateCcw, Clock, CheckCircle2, XCircle } from 'lucide-react'

const NETWORKS = [
  { value: 'mtn', label: 'MTN MoMo' },
  { value: 'telecel', label: 'Telecel Cash' },
  { value: 'at', label: 'AirtelTigo Money' },
]

type EligiblePurchase = {
  id: string
  packageName: string
  amount: number
  sessionsLeft: number
}

type RefundRequest = {
  id: string
  packageName: string
  amount: number
  network: string
  status: 'pending' | 'approved' | 'rejected'
  requestedAt: string
}

export default function RequestRefundSection({
  eligiblePurchases,
  refundRequests,
}: {
  eligiblePurchases: EligiblePurchase[]
  refundRequests: RefundRequest[]
}) {
  const router = useRouter()
  const [purchaseId, setPurchaseId] = useState(eligiblePurchases[0]?.id ?? '')
  const [network, setNetwork] = useState('mtn')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const pkg = eligiblePurchases.find((p) => p.id === purchaseId)
    if (!pkg) return
    const networkLabel = NETWORKS.find((n) => n.value === network)?.label ?? network
    if (!confirm(`Request a refund for "${pkg.packageName}" (GH₵${pkg.amount}) to your ${networkLabel}?\n\nYour trainer will review this request before any money is returned.`)) return

    setLoading(true)
    setError(null)

    const res = await fetch('/api/disbursements/request-refund', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ purchase_id: purchaseId, network }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Request failed. Please try again.')
      return
    }

    setSubmitted(true)
    router.refresh()
  }

  return (
    <section className="animate-fade-in-up" style={{ animationDelay: '180ms' }}>
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <RotateCcw size={14} />
        Refund Requests
      </h2>

      <div className="card mb-3">
        <p className="text-sm text-slate-400 mb-4">
          Need a refund? Submit a request and your trainer will review it. No money moves until they approve.
        </p>

        {submitted ? (
          <div className="flex items-center gap-2 text-sm text-emerald-400">
            <CheckCircle2 size={15} />
            Request submitted — your trainer will be in touch.
          </div>
        ) : eligiblePurchases.length > 0 ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Select package</label>
              <select
                value={purchaseId}
                onChange={(e) => setPurchaseId(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-50 w-full"
              >
                {eligiblePurchases.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.packageName} — GH₵{p.amount} ({p.sessionsLeft} session{p.sessionsLeft !== 1 ? 's' : ''} left)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Refund to</label>
              <select
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
            <button
              type="submit"
              disabled={loading || !purchaseId}
              className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium text-sm py-2 rounded-lg transition-all disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit refund request'}
            </button>
          </form>
        ) : (
          <p className="text-sm text-slate-500">No packages are eligible for a refund request right now.</p>
        )}
      </div>

      {refundRequests.length > 0 && (
        <div className="space-y-2">
          {refundRequests.map((r) => (
            <div key={r.id} className="card flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-50 text-sm">{r.packageName}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Requested {new Date(r.requestedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                <p className="text-xs text-slate-500">{NETWORKS.find((n) => n.value === r.network)?.label ?? r.network}</p>
              </div>
              <div className="text-right shrink-0 ml-3">
                <p className="text-sm font-semibold text-slate-50">GH₵{r.amount}</p>
                <StatusBadge status={r.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function StatusBadge({ status }: { status: 'pending' | 'approved' | 'rejected' }) {
  if (status === 'pending') {
    return (
      <span className="flex items-center gap-1 text-xs text-amber-400 mt-1 justify-end">
        <Clock size={10} />
        Awaiting review
      </span>
    )
  }
  if (status === 'approved') {
    return (
      <span className="flex items-center gap-1 text-xs text-emerald-400 mt-1 justify-end">
        <CheckCircle2 size={10} />
        Approved
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 text-xs text-red-400 mt-1 justify-end">
      <XCircle size={10} />
      Rejected
    </span>
  )
}
