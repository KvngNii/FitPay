import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import PackageCard from './PackageCard'
import RequestRefundSection from './RequestRefundSection'
import { ShoppingBag, PackageCheck } from 'lucide-react'
import type { Package } from '@/types'

export const dynamic = 'force-dynamic'

type Props = {
  searchParams: { payment?: string }
}

export default async function PackagesPage({ searchParams }: Props) {
  const auth = createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()

  const admin = createAdminSupabaseClient()

  const [{ data: packages }, { data: myPurchases }, { data: rawRefundRequests }] = await Promise.all([
    admin
      .from('packages')
      .select('*')
      .eq('is_active', true)
      .order('price_ghs', { ascending: true }),
    user
      ? admin
          .from('purchases')
          .select('id, status, sessions_left, created_at, packages(name, price_ghs, sessions)')
          .eq('client_id', user.id)
          .in('status', ['active', 'expired'])
          .order('created_at', { ascending: false })
          .limit(10)
      : Promise.resolve({ data: [] }),
    user
      ? admin
          .from('refund_requests')
          .select('id, purchase_id, amount_ghs, network, sessions_requested, status, requested_at, purchases(packages(name))')
          .eq('client_id', user.id)
          .order('requested_at', { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [] }),
  ])

  const paymentSuccess = searchParams.payment === 'success'

  // Purchase IDs that already have a pending or approved request
  const blockedPurchaseIds = new Set(
    (rawRefundRequests ?? [])
      .filter((r) => r.status === 'pending' || r.status === 'approved')
      .map((r) => r.purchase_id)
  )

  // Purchases eligible for a new refund request: active, not already blocked
  const eligiblePurchases = (myPurchases ?? [])
    .filter((p) => p.status === 'active' && !blockedPurchaseIds.has(p.id) && p.sessions_left > 0)
    .map((p) => {
      const pkg = p.packages as unknown as { name: string; price_ghs: number; sessions: number } | null
      return {
        id: p.id,
        packageName: pkg?.name ?? 'Package',
        fullPrice: Number(pkg?.price_ghs ?? 0),
        totalSessions: pkg?.sessions ?? 1,
        sessionsLeft: p.sessions_left,
      }
    })

  const refundRequests = (rawRefundRequests ?? []).map((r) => {
    const pkgName = (r.purchases as unknown as { packages: { name: string } | null } | null)?.packages?.name ?? 'Package'
    return {
      id: r.id,
      packageName: pkgName,
      amount: Number(r.amount_ghs),
      sessionsRequested: r.sessions_requested ?? 1,
      network: r.network,
      status: r.status as 'pending' | 'approved' | 'rejected',
      requestedAt: r.requested_at,
    }
  })

  return (
    <main className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold glow-text mb-1 animate-fade-in-up">Packages</h1>
      <p className="text-slate-400 text-sm mb-5">Buy sessions or manage your active packages.</p>

      {paymentSuccess && (
        <div className="bg-emerald-900/30 border border-emerald-500/40 rounded-xl p-4 mb-5 animate-fade-in-up">
          <p className="text-emerald-400 font-medium">Payment received!</p>
          <p className="text-slate-400 text-sm mt-1">
            Your package is being activated. Check your phone for a confirmation SMS.
          </p>
        </div>
      )}

      {/* My purchases */}
      {myPurchases && myPurchases.length > 0 && (
        <section className="mb-8 animate-fade-in-up" style={{ animationDelay: '60ms' }}>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <PackageCheck size={14} />
            My Packages
          </h2>
          <div className="space-y-3">
            {myPurchases.map((p) => {
              const pkg = p.packages as unknown as { name: string; price_ghs: number } | null
              const isActive = p.status === 'active'
              return (
                <div key={p.id} className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-50">{pkg?.name ?? 'Package'}</p>
                      <p className="text-sm text-slate-400 mt-0.5">
                        {isActive ? `${p.sessions_left} sessions remaining` : 'Expired'}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Purchased {new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="font-bold glow-text">GH₵{pkg?.price_ghs ?? 0}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full border mt-1 inline-block ${
                        isActive
                          ? 'bg-emerald-900/40 text-emerald-400 border-emerald-500/20'
                          : 'bg-slate-800 text-slate-500 border-slate-700'
                      }`}>
                        {p.status}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Buy new package */}
      <section className="mb-8 animate-fade-in-up" style={{ animationDelay: '120ms' }}>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <ShoppingBag size={14} />
          Buy a Package
        </h2>
        {packages && packages.length > 0 ? (
          <div className="space-y-4">
            {packages.map((pkg: Package) => (
              <PackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        ) : (
          <div className="card text-center py-10">
            <p className="text-slate-400">No packages available yet.</p>
            <p className="text-slate-500 text-sm mt-1">Check back soon.</p>
          </div>
        )}
      </section>

      {/* Refund requests — separate section */}
      {user && (
        <div className="border-t border-slate-800 pt-8">
          <RequestRefundSection
            eligiblePurchases={eligiblePurchases}
            refundRequests={refundRequests}
          />
        </div>
      )}
    </main>
  )
}
