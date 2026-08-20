'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RotateCcw, Clock, CheckCircle2, XCircle } from 'lucide-react'

const NETWORKS: Record<string, string> = {
  mtn: 'MTN MoMo',
  telecel: 'Telecel Cash',
  at: 'AirtelTigo Money',
}

type RefundRequest = {
  id: string
  clientName: string
  packageName: string
  amount: number
  network: string
  sessionsRequested: number
  status: 'pending' | 'approved' | 'rejected'
  requestedAt: string
  resolvedAt: string | null
}

export default function RefundRequestsSection({ requests }: { requests: RefundRequest[] }) {
  const pending = requests.filter((r) => r.status === 'pending')
  const resolved = requests.filter((r) => r.status !== 'pending')

  if (requests.length === 0) {
    return (
      <div className="card text-center py-6">
        <RotateCcw size={24} className="mx-auto text-slate-600 mb-2" />
        <p className="text-slate-400 text-sm">No refund requests yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {pending.map((r) => (
        <PendingCard key={r.id} request={r} />
      ))}
      {resolved.length > 0 && (
        <>
          {pending.length > 0 && (
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold pt-1">Resolved</p>
          )}
          {resolved.map((r) => (
            <ResolvedCard key={r.id} request={r} />
          ))}
        </>
      )}
    </div>
  )
}

function PendingCard({ request }: { request: RefundRequest }) {
  const router = useRouter()
  const [approving, setApproving] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleApprove() {
    const networkLabel = NETWORKS[request.network] ?? request.network.toUpperCase()
    if (!confirm(`Approve GH₵${request.amount} refund for ${request.clientName} via ${networkLabel}?\n\nThis will trigger an immediate Moolre transfer.`)) return
    setApproving(true)
    setError(null)
    const res = await fetch('/api/disbursements/approve-refund', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_id: request.id }),
    })
    const data = await res.json()
    setApproving(false)
    if (!res.ok) {
      setError(data.error ?? 'Approval failed. Try again.')
      return
    }
    setDone(true)
    router.refresh()
  }

  async function handleReject() {
    if (!confirm(`Reject the refund request from ${request.clientName}? They will be notified via SMS.`)) return
    setRejecting(true)
    setError(null)
    const res = await fetch('/api/disbursements/reject-refund', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_id: request.id }),
    })
    const data = await res.json()
    setRejecting(false)
    if (!res.ok) {
      setError(data.error ?? 'Rejection failed. Try again.')
      return
    }
    setDone(true)
    router.refresh()
  }

  if (done) return null

  return (
    <div className="card border border-amber-500/20">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-slate-50">{request.clientName}</p>
          <p className="text-sm text-slate-400">{request.packageName}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {request.sessionsRequested} session{request.sessionsRequested !== 1 ? 's' : ''} · {NETWORKS[request.network] ?? request.network}
          </p>
          <p className="text-xs text-slate-600 mt-0.5">
            Requested {new Date(request.requestedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <div className="text-right shrink-0 ml-3">
          <p className="font-bold glow-text">GH₵{request.amount}</p>
          <span className="flex items-center gap-1 text-xs text-amber-400 mt-1 justify-end">
            <Clock size={10} />
            Pending
          </span>
        </div>
      </div>
      {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleApprove}
          disabled={approving || rejecting}
          className="flex-1 bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-500/30 font-medium text-sm py-2 rounded-lg transition-all disabled:opacity-50"
        >
          {approving ? 'Processing...' : 'Approve & Refund'}
        </button>
        <button
          onClick={handleReject}
          disabled={approving || rejecting}
          className="px-4 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-500/20 text-sm rounded-lg transition-all disabled:opacity-50"
        >
          {rejecting ? '...' : 'Reject'}
        </button>
      </div>
    </div>
  )
}

function ResolvedCard({ request }: { request: RefundRequest }) {
  const approved = request.status === 'approved'
  return (
    <div className="card flex items-center justify-between opacity-60">
      <div>
        <p className="font-medium text-slate-50 text-sm">{request.clientName}</p>
        <p className="text-xs text-slate-500">
          {request.packageName} · {NETWORKS[request.network] ?? request.network}
        </p>
        {request.resolvedAt && (
          <p className="text-xs text-slate-600 mt-0.5">
            {approved ? 'Approved' : 'Rejected'}{' '}
            {new Date(request.resolvedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        )}
      </div>
      <div className="text-right shrink-0 ml-3">
        <p className="text-sm font-semibold text-slate-50">GH₵{request.amount}</p>
        {approved ? (
          <span className="flex items-center gap-1 text-xs text-emerald-400 mt-1 justify-end">
            <CheckCircle2 size={10} />
            Approved
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-red-400 mt-1 justify-end">
            <XCircle size={10} />
            Rejected
          </span>
        )}
      </div>
    </div>
  )
}
