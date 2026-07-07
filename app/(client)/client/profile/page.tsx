'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MedicalHistoryFields, EMPTY_MEDICAL_HISTORY, type MedicalHistoryFormState } from '@/components/MedicalHistoryFields'
import DeleteAccountButton from '@/components/DeleteAccountButton'
import Image from 'next/image'
import { Camera } from 'lucide-react'
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
  const [consentLocked, setConsentLocked] = useState(false)

  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
        setCurrentAvatarUrl((profile as { avatar_url?: string | null }).avatar_url ?? null)
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
          consent_acknowledged: history.consent_acknowledged,
        })
        // Once signed, the clearance can be viewed but never un-signed.
        setConsentLocked(history.consent_acknowledged === true)
      }

      setLoadingData(false)
    }
    load()
  }, [router])

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

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

    // Upload avatar if a new one was selected
    let newAvatarUrl = currentAvatarUrl
    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop() ?? 'jpg'
      const filePath = `${user.id}/avatar.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, { upsert: true })

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
        newAvatarUrl = publicUrl
        setCurrentAvatarUrl(publicUrl)
        setAvatarFile(null)
        setAvatarPreview(null)
      }
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
        avatar_url: newAvatarUrl,
      })
      .eq('id', user.id)

    if (profileError) {
      setError(profileError.message)
      setSaving(false)
      return
    }

    if (!medical.consent_acknowledged) {
      setError('Please confirm the declaration before saving.')
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
      consent_acknowledged: true,
      consent_acknowledged_at: new Date().toISOString(),
      valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      trainer_reviewed: false,
      trainer_reviewed_at: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'client_id' })

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
        <p className="text-slate-400 text-sm">Loading...</p>
      </main>
    )
  }

  const displayAvatar = avatarPreview ?? currentAvatarUrl
  const initials = name.trim().split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()

  return (
    <main className="p-4 max-w-lg mx-auto pb-10">
      <h1 className="text-2xl font-bold glow-text mb-6">Edit Profile</h1>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Avatar */}
        <div className="flex flex-col items-center mb-2">
          <div className="relative">
            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-emerald-500/20 to-teal-400/10 border-2 border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              {displayAvatar ? (
                <Image
                  src={displayAvatar}
                  alt="Profile photo"
                  fill
                  className="object-cover"
                  sizes="96px"
                  unoptimized={displayAvatar.startsWith('blob:')}
                />
              ) : (
                <span className="text-2xl font-bold text-emerald-400">{initials || '?'}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 hover:bg-emerald-400 transition-colors rounded-full flex items-center justify-center shadow-md shadow-emerald-500/30"
            >
              <Camera size={14} className="text-slate-950" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <p className="text-xs text-slate-500 mt-3">Tap camera to change photo</p>
        </div>

        <div className="pt-1">
          <p className="text-sm font-semibold text-slate-300 mb-3">Personal details</p>
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
            <input id="height" type="number" min="50" max="250" step="0.1" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="weight">Weight (kg)</label>
            <input id="weight" type="number" min="20" max="300" step="0.1" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} required />
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800">
          <p className="text-sm font-semibold text-slate-300 mt-3 mb-3">Training profile</p>
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
          <p className="text-sm font-semibold text-slate-300 mt-3 mb-3">Emergency contact</p>
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
          <p className="text-xs text-slate-500 mb-3">
            Updating this will flag your profile for your trainer to review again.
          </p>
        </div>

        <MedicalHistoryFields value={medical} onChange={setMedical} consentLocked={consentLocked} />

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        {success && <p className="text-emerald-400 text-sm text-center">Profile updated.</p>}

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </form>

      <DeleteAccountButton />
    </main>
  )
}
