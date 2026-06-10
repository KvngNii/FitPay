'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MedicalHistoryFields, EMPTY_MEDICAL_HISTORY, type MedicalHistoryFormState } from '@/components/MedicalHistoryFields'

export default function MedicalHistoryPage() {
  const router = useRouter()

  const [form, setForm] = useState<MedicalHistoryFormState>(EMPTY_MEDICAL_HISTORY)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('You must be signed in to continue.')
      setLoading(false)
      return
    }

    if (!form.consent_acknowledged) {
      setError('Please confirm the declaration before continuing.')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase.from('medical_history').upsert({
      client_id: user.id,
      heart_condition_or_bp: form.heart_condition_or_bp,
      chest_pain: form.chest_pain,
      dizziness_or_consciousness: form.dizziness_or_consciousness,
      chronic_condition: form.chronic_condition,
      chronic_condition_details: form.chronic_condition ? form.chronic_condition_details : null,
      prescribed_medication: form.prescribed_medication,
      medication_details: form.prescribed_medication ? form.medication_details : null,
      bone_or_joint_problem: form.bone_or_joint_problem,
      bone_or_joint_details: form.bone_or_joint_problem ? form.bone_or_joint_details : null,
      previous_injuries_surgeries: form.previous_injuries_surgeries || null,
      current_pain_areas: form.current_pain_areas || null,
      allergies: form.allergies || null,
      additional_notes: form.additional_notes || null,
      consent_acknowledged: true,
      consent_acknowledged_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    // Fire onboarding AI trigger now that injuries/conditions are known (non-blocking)
    fetch('/api/ai/onboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: user.id }),
    }).catch(() => {})

    router.push('/client/dashboard')
  }

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="w-full max-w-sm mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-emerald-400">Medical History</h1>
          <p className="text-slate-400 mt-2 text-sm">
            Before your first session, your trainer needs to know about any health
            conditions or injuries so your plan is safe for you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <MedicalHistoryFields value={form} onChange={setForm} />

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Saving…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
