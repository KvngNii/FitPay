import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server'
import WithdrawForm from './WithdrawForm'

export const dynamic = 'force-dynamic'

export default async function EarningsPage() {
  const auth = createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()

  const admin = createAdminSupabaseClient()

  const [{ data: purchases }, { data: disbursements }, { data: trainer }] = await Promise.all([
    admin
      .from('purchases')
      .select('id, created_at, status, packages(name, price_ghs), users!client_id(name)')
      .in('status', ['active', 'expired'])
      .order('created_at', { ascending: false }),
    admin
      .from('disbursements')
      .select('id, amount_ghs, type, status, created_at')
      .eq('trainer_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(20),
    admin
      .from('users')
      .select('phone')
      .eq('id', user!.id)
      .single(),
  ])

  const totalRevenue = (purchases ?? []).reduce((sum: number, p) => {
    return sum + Number((p.packages as unknown as { price_ghs: number } | null)?.price_ghs ?? 0)
  }, 0)

  const totalWithdrawn = (disbursements ?? [])
    .filter((d) => d.status === 'success' && d.type === 'withdrawal')
    .reduce((sum: number, d) => sum + Number(d.amount_ghs), 0)

  const available = totalRevenue - totalWithdrawn

  return (
    <main className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-emerald-400 mb-5">Earnings</h1>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card text-center">
          <p className="text-xl font-bold text-emerald-400">GH₵{totalRevenue}</p>
          <p className="text-xs text-slate-400 mt-1">Total earned</p>
        </div>
        <div className="card text-center">
          <p className="text-xl font-bold text-slate-50">GH₵{totalWithdrawn}</p>
          <p className="text-xs text-slate-400 mt-1">Withdrawn</p>
        </div>
        <div className="card text-center">
          <p className="text-xl font-bold text-emerald-400">GH₵{available}</p>
          <p className="text-xs text-slate-400 mt-1">Available</p>
        </div>
      </div>

      {/* Withdraw button */}
      <div className="mb-8">
        <WithdrawForm available={available} defaultPhone={trainer?.phone ?? ''} />
      </div>

      {/* Package sales */}
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Package Sales</h2>
      {purchases && purchases.length > 0 ? (
        <div className="space-y-2 mb-8">
          {purchases.map((p) => (
            <div key={p.id} className="card flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-50">{(p.users as unknown as { name: string } | null)?.name}</p>
                <p className="text-sm text-slate-400">
                  {(p.packages as unknown as { name: string; price_ghs: number } | null)?.name} · {new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </p>
              </div>
              <p className="font-semibold text-emerald-400">GH₵{(p.packages as unknown as { name: string; price_ghs: number } | null)?.price_ghs}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-6 mb-8">
          <p className="text-slate-400 text-sm">No sales yet.</p>
        </div>
      )}

      {/* Withdrawal history */}
      {disbursements && disbursements.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Withdrawal History</h2>
          <div className="space-y-2">
            {disbursements.map((d) => (
              <div key={d.id} className="card flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-50 capitalize">{d.type}</p>
                  <p className="text-sm text-slate-400">
                    {new Date(d.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-50">GH₵{d.amount_ghs}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    d.status === 'success' ? 'bg-emerald-900/40 text-emerald-400' :
                    d.status === 'failed' ? 'bg-red-900/40 text-red-400' :
                    'bg-slate-800 text-slate-400'
                  }`}>{d.status}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  )
}
