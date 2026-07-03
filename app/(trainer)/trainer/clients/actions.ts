'use server'

import { revalidatePath } from 'next/cache'
import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server'

export async function markMedicalReviewed(
  clientId: string
): Promise<{ success: boolean; error?: string }> {
  const auth = createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const admin = createAdminSupabaseClient()
  const { data: profile } = await admin.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'trainer') return { success: false, error: 'Forbidden' }

  // Update without .select() so PostgREST does not add a RETURNING clause —
  // RETURNING on tables with GENERATED ALWAYS AS STORED columns can cause silent
  // failures in some Supabase/PostgREST versions.
  const { error: updateError } = await admin
    .from('medical_history')
    .update({
      trainer_reviewed: true,
      trainer_reviewed_at: new Date().toISOString(),
    })
    .eq('client_id', clientId)

  if (updateError) {
    console.error('[markMedicalReviewed] update error:', JSON.stringify(updateError))
    return { success: false, error: updateError.message }
  }

  // Read back the value to confirm the write actually persisted
  const { data: check, error: checkError } = await admin
    .from('medical_history')
    .select('trainer_reviewed')
    .eq('client_id', clientId)
    .single()

  if (checkError) {
    console.error('[markMedicalReviewed] verification select error:', JSON.stringify(checkError))
    return { success: false, error: 'Could not verify update. Try again.' }
  }

  if (!check?.trainer_reviewed) {
    console.error('[markMedicalReviewed] write did not persist — trainer_reviewed still false after update. client_id:', clientId)
    return { success: false, error: 'Update did not save. Please try again or contact support.' }
  }

  // Clear Next.js cache for the clients page so the server re-fetches on next load
  revalidatePath('/trainer/clients')

  return { success: true }
}
