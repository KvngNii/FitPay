'use client'

import { useState } from 'react'
import type { Package } from '@/types'

export default function PackageCard({ pkg }: { pkg: Package }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleBuy() {
    setLoading(true)
    setError(null)

    const res = await fetch('/api/payments/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ package_id: pkg.id }),
    })

    const data = await res.json()

    if (!res.ok || !data.authorization_url) {
      setError(data.error ?? 'Could not start payment. Try again.')
      setLoading(false)
      return
    }

    window.location.href = data.authorization_url
  }

  const perSession = (pkg.price_ghs / pkg.sessions).toFixed(2)

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">{pkg.name}</h2>
          <p className="text-sm text-slate-400">{pkg.duration_days} days validity</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-emerald-400">GH₵{pkg.price_ghs}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <span className="text-sm bg-slate-800 text-slate-300 px-3 py-1 rounded-full">
          {pkg.sessions} sessions
        </span>
        <span className="text-sm text-slate-500">GH₵{perSession} / session</span>
      </div>

      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

      <button onClick={handleBuy} disabled={loading} className="btn-primary">
        {loading ? 'Opening payment…' : `Buy for GH₵${pkg.price_ghs}`}
      </button>
    </div>
  )
}
