'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function TrainerDashboard() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <main className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-emerald-400">Trainer Dashboard</h1>
        <button onClick={handleSignOut} className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
          Sign out
        </button>
      </div>
      <p className="text-slate-400">Overview of clients, sessions, and earnings — coming soon.</p>
    </main>
  )
}
