import { createServerSupabaseClient } from '@/lib/supabase/server'
import PackageCard from './PackageCard'
import type { Package } from '@/types'

export const dynamic = 'force-dynamic'

type Props = {
  searchParams: { payment?: string }
}

export default async function PackagesPage({ searchParams }: Props) {
  const supabase = createServerSupabaseClient()

  const { data: packages } = await supabase
    .from('packages')
    .select('*')
    .eq('is_active', true)
    .order('price_ghs', { ascending: true })

  const paymentSuccess = searchParams.payment === 'success'

  return (
    <main className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-emerald-400 mb-1">Packages</h1>
      <p className="text-slate-400 text-sm mb-5">
        Choose a package to book sessions with your trainer.
      </p>

      {paymentSuccess && (
        <div className="bg-emerald-900/30 border border-emerald-500/40 rounded-xl p-4 mb-5">
          <p className="text-emerald-400 font-medium">Payment received!</p>
          <p className="text-slate-400 text-sm mt-1">
            Your package is being activated. Check your phone for a confirmation SMS.
          </p>
        </div>
      )}

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
    </main>
  )
}
