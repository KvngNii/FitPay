'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  available: number
  defaultPhone: string
}

const NETWORKS = [
  { value: 'mtn', label: 'MTN MoMo' },
  { value: 'telecel', label: 'Telecel Cash' },
  { value: 'at', label: 'AirtelTigo Money' },
]

export default function WithdrawForm({ available, defaultPhone }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [phone, setPhone] = useState(defaultPhone)
  const [network, setNetwork] = useState('mtn')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ amount: number; receiver: string } | null>(null)

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/disbursements/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Number(amount), phone, network }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Withdrawal failed. Try again.')
      return
    }

    setSuccess({ amount: data.amount, receiver: data.receiver })
    setAmount('')
    router.refresh()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        disabled={available <= 0}
        className="btn-primary"
      >
        Withdraw funds
      </button>
    )
  }

  if (success) {
    return (
      <div className="card bg-emerald-900/20 border-emerald-500/40">
        <p className="font-semibold text-emerald-400">Transfer successful!</p>
        <p className="text-slate-300 text-sm mt-1">
          GH₵{success.amount} sent to {success.receiver}
        </p>
        <button
          onClick={() => { setSuccess(null); setOpen(false) }}
          className="mt-4 text-sm text-slate-400 hover:text-slate-200"
        >
          Done
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleWithdraw} className="card space-y-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-slate-50">Withdraw funds</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-300 text-sm">
          Cancel
        </button>
      </div>

      <div>
        <label htmlFor="amount">Amount (GH₵)</label>
        <input
          id="amount"
          type="number"
          min="1"
          max={available}
          step="0.01"
          placeholder={`Max GH₵${available}`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>

      <div>
        <label htmlFor="phone">MoMo number</label>
        <input
          id="phone"
          type="tel"
          placeholder="0244000000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
      </div>

      <div>
        <label htmlFor="network">Network</label>
        <select
          id="network"
          value={network}
          onChange={(e) => setNetwork(e.target.value)}
        >
          {NETWORKS.map((n) => (
            <option key={n.value} value={n.value}>{n.label}</option>
          ))}
        </select>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? 'Sending…' : `Withdraw GH₵${amount || '0'}`}
      </button>
    </form>
  )
}
