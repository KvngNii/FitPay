'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MedicalHistoryFields, EMPTY_MEDICAL_HISTORY, type MedicalHistoryFormState } from '@/components/MedicalHistoryFields'
import type { FitnessGoal, FitnessLevel, Gender } from '@/types'

export default function ProfilePage() {
  const router = useRouter()

  const [loadingData, setLoadingData] = useState(true)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [goal, setGoal] = useState<FitnessGoal>('general')
  const [fitnessLevel, setFitnessLevel] = useState<FitnessLevel>('beginner')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState<Gender>('prefer_not_to_say')
  const [heightCm, setHeightCm] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [emergencyContactName, setEmergencyContactName] = useState('')
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('')
  const [medical, setMedical] = useState<MedicalHistoryFormState>(EMPTY_MEDICAL_HISTORY)

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const [{ data: profile }, { data: history }] = await Promise.all([
        supabase.from('users').select('*').eq('id', user.id).single(),
        supabase.from('medical_history').select('*').eq('client_id', user.id).maybeSingle(),
      ])

      if (profile) {
        setName(profile.name ?? '')
        setPhone(profile.phone ?? '')
        setEmail(profile.email ?? '')
        setGoal((profile.goal as FitnessGoal) ?? 'general')
        setFitnessLevel((profile.fitness_level as FitnessLevel) ?? 'beginner')
        setDateOfBirth(profile.date_of_birth ?? '')
        setGender((profile.gender as Gender) ?? 'prefer_not_to_say')
        setHeightCm(profile.height_cm != null ? String(profile.height_cm) : '')
        setWeightKg(profile.weight_kg != null ? String(profile.weight_kg) : '')
        setEmergencyContactName(profile.emergency_contact_name ?? '')
        setEmergencyContactPhone(profile.emergency_contact_phone ?? '')
      }

      if (history) {
        setMedical({
          heart_condition_or_bp: history.heart_condition_or_bp,
          chest_pain: history.chest_pain,
          dizziness_or_consciousness: history.dizziness_or_consciousness,
          chronic_condition: history.chronic_condition,
          chronic_condition_details: history.chronic_condition_details ?? '',
          prescribed_medication: history.prescribed_medication,
          medication_details: history.medication_details ?? '',
          bone_or_joint_problem: history.bone_or_joint_problem,
          bone_or_joint_details: history.bone_or_joint_details ?? '',
          previous_injuries_surgeries: history.previous_injuries_surgeries ?? '',
          current_pain_areas: history.current_pain_areas ?? '',
          allergies: history.allergies ?? '',
          additional_notes: history.additional_notes ?? '',
        })
      }

      setLoadingData(false)
    }
    load()
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setSaving(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('You must be signed in to continue.')
      setSaving(false)
      return
    }

    const { error: profileError } = await supabase
      .from('users')
      .update({
        name,
        phone,
        goal,
        fitness_level: fitnessLevel,
        date_of_birth: dateOfBirth || null,
        gender,
        height_cm: heightCm ? Number(heightCm) : null,
        weight_kg: weightKg ? Number(weightKg) : null,
        emergency_contact_name: emergencyContactName || null,
        emergency_contact_phone: emergencyContactPhone || null,
      })
      .eq('id', user.id)

    if (profileError) {
      setError(profileError.message)
      setSaving(false)
      return
    }

    const { error: medicalError } = await supabase.from('medical_history').upsert({
      client_id: user.id,
      heart_condition_or_bp: medical.heart_condition_or_bp,
      chest_pain: medical.chest_pain,
      dizziness_or_consciousness: medical.dizziness_or_consciousness,
      chronic_condition: medical.chronic_condition,
      chronic_condition_details: medical.chronic_condition ? medical.chronic_condition_details : null,
      prescribed_medication: medical.prescribed_medication,
      medication_details: medical.prescribed_medication ? medical.medication_details : null,
      bone_or_joint_problem: medical.bone_or_joint_problem,
      bone_or_joint_details: medical.bone_or_joint_problem ? medical.bone_or_joint_details : null,
      previous_injuries_surgeries: medical.previous_injuries_surgeries || null,
      current_pain_areas: medical.current_pain_areas || null,
      allergies: medical.allergies || null,
      additional_notes: medical.additional_notes || null,
      // Re-flag for trainer review since details may have changed
      trainer_reviewed: false,
      trainer_reviewed_at: null,
      updated_at: new Date().toISOString(),
    })

    if (medicalError) {
      setError(medicalError.message)
      setSaving(false)
      return
    }

    setSuccess(true)
    setSaving(false)
    router.refresh()
  }

  if (loadingData) {
    return (
      <main className="p-4 max-w-lg mx-auto">
        <p className="text-slate-400 text-sm">Loading…</p>
      </main>
    )
  }

  return (
    <main className="p-4 max-w-lg mx-auto pb-10">
      <h1 className="text-2xl font-bold text-emerald-400 mb-5">Edit Profile</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="pt-1">
          <p className="text-sm font-semibold text-slate-300 mb-1">Personal details</p>
        </div>

        <div>
          <label htmlFor="name">Full name</label>
          <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div>
          <label htmlFor="phone">Phone number</label>
          <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </div>

        <div>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} disabled className="opacity-60 cursor-not-allowed" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="dob">Date of birth</label>
            <input id="dob" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="gender">Gender</label>
            <select id="gender" value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="height">Height (cm)</label>
            <input
              id="height" type="number" min="50" max="250" step="0.1"
              value={heightCm} onChange={(e) => setHeightCm(e.target.value)} required
            />
          </div>
          <div>
            <label htmlFor="weight">Weight (kg)</label>
            <input
              id="weight" type="number" min="20" max="300" step="0.1"
              value={weightKg} onChange={(e) => setWeightKg(e.target.value)} required
            />
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800">
          <p className="text-sm font-semibold text-slate-300 mt-3 mb-1">Training profile</p>
        </div>

        <div>
          <label htmlFor="goal">Fitness goal</label>
          <select id="goal" value={goal} onChange={(e) => setGoal(e.target.value as FitnessGoal)}>
            <option value="general">General fitness</option>
            <option value="weight_loss">Weight loss</option>
            <option value="strength">Strength</option>
            <option value="endurance">Endurance</option>
          </select>
        </div>

        <div>
          <label htmlFor="fitness_level">Fitness level</label>
          <select id="fitness_level" value={fitnessLevel} onChange={(e) => setFitnessLevel(e.target.value as FitnessLevel)}>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div className="pt-2 border-t border-slate-800">
          <p className="text-sm font-semibold text-slate-300 mt-3 mb-1">Emergency contact</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="ec_name">Contact name</label>
            <input id="ec_name" type="text" value={emergencyContactName} onChange={(e) => setEmergencyContactName(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="ec_phone">Contact phone</label>
            <input id="ec_phone" type="tel" value={emergencyContactPhone} onChange={(e) => setEmergencyContactPhone(e.target.value)} required />
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800">
          <p className="text-sm font-semibold text-slate-300 mt-3 mb-1">Medical history</p>
          <p className="text-xs text-slate-500 mb-2">
            Updating this will flag your profile for your trainer to review again.
          </p>
        </div>

        <MedicalHistoryFields value={medical} onChange={setMedical} />

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        {success && <p className="text-emerald-400 text-sm text-center">Profile updated.</p>}

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </main>
  )
}
