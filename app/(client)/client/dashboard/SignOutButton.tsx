'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button
      onClick={handleSignOut}
      aria-label="Sign out"
      className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
    >
      <LogOut size={15} />
      <span>Sign out</span>
    </button>
  )
}
