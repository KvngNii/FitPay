import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET /api/trainers - public list of trainers (id + name only) for the signup
// dropdown. Uses the service role so we can expose just these two fields
// without opening trainer rows to anonymous reads via RLS.
export async function GET() {
  const admin = createAdminSupabaseClient()
  const { data, error } = await admin
    .from('users')
    .select('id, name')
    .eq('role', 'trainer')
    .order('name', { ascending: true })

  if (error) {
    console.error('List trainers error:', error)
    return NextResponse.json({ trainers: [] }, { status: 500 })
  }

  return NextResponse.json({ trainers: data ?? [] })
}
