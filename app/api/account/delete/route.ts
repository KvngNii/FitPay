import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'

// POST /api/account/delete — permanently delete the signed-in user's account.
// Removes the public.users row (FK cascade clears their sessions, purchases,
// workout logs, progression rules, medical history and refund requests), the
// avatar, and finally the auth user.
export async function POST() {
  const auth = createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminSupabaseClient()

  // Best-effort avatar cleanup (folder is keyed by user id).
  try {
    const { data: files } = await admin.storage.from('avatars').list(user.id)
    if (files && files.length > 0) {
      await admin.storage.from('avatars').remove(files.map((f) => `${user.id}/${f.name}`))
    }
  } catch {
    // non-fatal
  }

  // ussd_sessions.client_id has no cascade — clear any lingering rows first so
  // they don't block the users delete.
  await admin.from('ussd_sessions').delete().eq('client_id', user.id)

  // Delete the profile row — FK ON DELETE CASCADE clears dependent data.
  const { error: rowError } = await admin.from('users').delete().eq('id', user.id)
  if (rowError) {
    console.error('Account delete — users row error:', rowError)
    return NextResponse.json({ error: 'Could not delete your data. Please try again.' }, { status: 500 })
  }

  // Remove the auth identity so the email/phone can be reused.
  const { error: authError } = await admin.auth.admin.deleteUser(user.id)
  if (authError) {
    console.error('Account delete — auth user error:', authError)
    // Profile data is already gone; surface partial success so the client signs out.
    return NextResponse.json({ success: true, warning: 'Profile removed; auth cleanup pending.' })
  }

  return NextResponse.json({ success: true })
}
