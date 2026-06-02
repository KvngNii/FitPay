'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ClientDashboard() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <main className="p-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-emerald-400">Dashboard</h1>
        <button onClick={handleSignOut} className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
          Sign out
        </button>
      </div>
      <p className="text-slate-400">Client dashboard — coming soon.</p>
    </main>
  )
}
