import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const auth = createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json({ exercises: [] })

  const admin = createAdminSupabaseClient()
  const { data, error } = await admin
    .from('exercises')
    .select('id, name, category, body_part, equipment, target, image_url, gif_url, attribution')
    .ilike('name', `%${q}%`)
    .order('name')
    .limit(12)

  if (error) return NextResponse.json({ error: 'Search failed' }, { status: 500 })

  return NextResponse.json({ exercises: data })
}
