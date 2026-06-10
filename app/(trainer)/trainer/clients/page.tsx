import { createAdminSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ClientsPage() {
  const admin = createAdminSupabaseClient()

  const { data: clients } = await admin
    .from('users')
    .select('id, name, phone, email, goal, fitness_level, health_notes, emergency_contact_name, emergency_contact_phone, created_at')
    .eq('role', 'client')
    .order('created_at', { ascending: false })

  const clientIds = clients?.map((c) => c.id) ?? []

  const { data: activePurchases } = clientIds.length > 0
    ? await admin
        .from('purchases')
        .select('client_id, sessions_left, expires_at, packages(name)')
        .eq('status', 'active')
        .in('client_id', clientIds)
    : { data: [] }

  const purchaseMap = Object.fromEntries(
    (activePurchases ?? []).map((p: any) => [p.client_id, p])
  )

  return (
    <main className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-emerald-400 mb-1">Clients</h1>
      <p className="text-slate-400 text-sm mb-5">{clients?.length ?? 0} registered</p>

      {clients && clients.length > 0 ? (
        <div className="space-y-3">
          {clients.map((client) => {
            const purchase = purchaseMap[client.id]
            return (
              <div key={client.id} className="card">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-slate-50">{client.name}</p>
                    <p className="text-sm text-slate-400">{client.phone}</p>
                  </div>
                  {purchase ? (
                    <span className="text-xs bg-emerald-900/40 text-emerald-400 px-2 py-1 rounded-full shrink-0">
                      Active
                    </span>
                  ) : (
                    <span className="text-xs bg-slate-800 text-slate-500 px-2 py-1 rounded-full shrink-0">
                      No package
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-slate-400">
                  {purchase ? (
                    <>
                      <span>{(purchase.packages as any)?.name}</span>
                      <span>·</span>
                      <span>{purchase.sessions_left} sessions left</span>
                    </>
                  ) : (
                    <span>No active package</span>
                  )}
                </div>

                {client.goal && (
                  <div className="mt-2 flex gap-2">
                    <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full capitalize">
                      {client.goal.replace('_', ' ')}
                    </span>
                    {client.fitness_level && (
                      <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full capitalize">
                        {client.fitness_level}
                      </span>
                    )}
                  </div>
                )}

                {client.health_notes && client.health_notes.trim().toLowerCase() !== 'none' && (
                  <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-yellow-900/20 border border-yellow-800/40">
                    <p className="text-xs text-yellow-400">
                      <span className="font-medium">Health note:</span> {client.health_notes}
                    </p>
                  </div>
                )}

                {client.emergency_contact_name && (
                  <p className="text-xs text-slate-500 mt-2">
                    Emergency contact: {client.emergency_contact_name} · {client.emergency_contact_phone}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card text-center py-10">
          <p className="text-slate-400">No clients yet.</p>
          <p className="text-slate-500 text-sm mt-1">Share your signup link to get started.</p>
        </div>
      )}
    </main>
  )
}
