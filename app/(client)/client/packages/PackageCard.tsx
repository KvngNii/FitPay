'use client'

import { useState } from 'react'
import type { Package } from '@/types'

const PACKAGE_FEATURES: Record<string, string[]> = {
  Starter: [],
  Premium: ['Meal plans included'],
  Elite: ['Daily check-ins', 'Meal plans included', 'Video call training option'],
}

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

  const perSession = (pkg.price_ghs / pkg.sessions).toFixed(0)
  const features = PACKAGE_FEATURES[pkg.name] ?? []

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">{pkg.name}</h2>
          <p className="text-slate-400 text-sm">{pkg.sessions} sessions</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-emerald-400">GH₵{perSession}</p>
          <p className="text-xs text-slate-500">per session</p>
        </div>
      </div>

      {features.length > 0 && (
        <ul className="mb-5 space-y-1.5">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
              <span className="text-emerald-400 shrink-0">✓</span>
              {f}
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

      <button onClick={handleBuy} disabled={loading} className="btn-primary">
        {loading ? 'Opening payment…' : `Buy for GH₵${pkg.price_ghs}`}
      </button>
    </div>
  )
}
