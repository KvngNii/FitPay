import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import PackageCard from './PackageCard'
import ClientRefundButton from './ClientRefundButton'
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

  const [{ data: packages }, { data: myPurchases }] = await Promise.all([
    admin
      .from('packages')
      .select('*')
      .eq('is_active', true)
      .order('price_ghs', { ascending: true }),
    user
      ? admin
          .from('purchases')
          .select('id, status, sessions_left, created_at, packages(name, price_ghs)')
          .eq('client_id', user.id)
          .in('status', ['active', 'expired'])
          .order('created_at', { ascending: false })
          .limit(10)
      : Promise.resolve({ data: [] }),
  ])

  const paymentSuccess = searchParams.payment === 'success'

  return (
    <main className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold glow-text mb-1 animate-fade-in-up">Packages</h1>
      <p className="text-slate-400 text-sm mb-5">Buy sessions or request a reimbursement.</p>

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

                  <ClientRefundButton
                    purchaseId={p.id}
                    amount={Number(pkg?.price_ghs ?? 0)}
                    packageName={pkg?.name ?? 'Package'}
                  />
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Buy new package */}
      <section className="animate-fade-in-up" style={{ animationDelay: '120ms' }}>
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
    </main>
  )
}
