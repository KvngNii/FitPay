'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { FitnessGoal, FitnessLevel, Gender } from '@/types'

export default function SignupPage() {
  const router = useRouter()

  // Self-service signup creates client accounts only. Trainer accounts are
  // provisioned out-of-band; the users RLS policy also enforces this.
  const role = 'client' as const

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [trainerId, setTrainerId] = useState('')
  const [trainers, setTrainers] = useState<{ id: string; name: string }[]>([])
  const [goal, setGoal] = useState<FitnessGoal>('general')
  const [fitnessLevel, setFitnessLevel] = useState<FitnessLevel>('beginner')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState<Gender>('prefer_not_to_say')
  const [heightCm, setHeightCm] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [emergencyContactName, setEmergencyContactName] = useState('')
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Load the list of trainers so a client can pick who they train with.
  useEffect(() => {
    fetch('/api/trainers')
      .then((r) => r.json())
      .then((d) => setTrainers(d.trainers ?? []))
      .catch(() => setTrainers([]))
  }, [])

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (role === 'client' && !trainerId) {
      setError('Please choose your trainer.')
      return
    }

    setLoading(true)

    const supabase = createClient()

    const { data, error: authError } = await supabase.auth.signUp({ email, password })

    if (authError || !data.user) {
      setError(authError?.message ?? 'Signup failed')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase.from('users').insert({
      id: data.user.id,
      name,
      phone,
      email,
      role,
      trainer_id: trainerId,
      goal,
      fitness_level: fitnessLevel,
      date_of_birth: dateOfBirth || null,
      gender,
      height_cm: heightCm ? Number(heightCm) : null,
      weight_kg: weightKg ? Number(weightKg) : null,
      emergency_contact_name: emergencyContactName || null,
      emergency_contact_phone: emergencyContactPhone || null,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push('/onboarding/medical-history')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(16,185,129,0.14), transparent), radial-gradient(ellipse 50% 40% at 80% 80%, rgba(20,184,166,0.07), transparent)',
        }}
      />

      <div className="relative w-full max-w-sm animate-fade-in-up">
        <div className="text-center mb-8">
          <span className="glow-text font-bold text-3xl tracking-tight">FitPay</span>
          <p className="text-slate-400 mt-2 text-sm">Create your account</p>
        </div>

        <div className="card px-6 py-7">
          <form onSubmit={handleSignup} className="space-y-4">

            <div>
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                type="text"
                placeholder="Kofi Mensah"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="phone">Phone number</label>
              <input
                id="phone"
                type="tel"
                placeholder="0244000000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Min 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <>
                <div className="pt-3 border-t border-slate-800">
                  <p className="text-sm font-semibold text-slate-300 mt-1 mb-3">Your trainer</p>
                </div>

                <div>
                  <label htmlFor="trainer">Who do you train with?</label>
                  <select
                    id="trainer"
                    value={trainerId}
                    onChange={(e) => setTrainerId(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select your trainer</option>
                    {trainers.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  {trainers.length === 0 && (
                    <p className="text-xs text-slate-500 mt-1">No trainers are available yet. Please check back soon.</p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800">
                  <p className="text-sm font-semibold text-slate-300 mt-1 mb-3">Training profile</p>
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
                    <input id="height" type="number" placeholder="170" min="50" max="250" step="0.1" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} required />
                  </div>
                  <div>
                    <label htmlFor="weight">Weight (kg)</label>
                    <input id="weight" type="number" placeholder="70" min="20" max="300" step="0.1" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} required />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800">
                  <p className="text-sm font-semibold text-slate-300 mt-1 mb-3">Emergency contact</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="ec_name">Contact name</label>
                    <input id="ec_name" type="text" placeholder="Ama Mensah" value={emergencyContactName} onChange={(e) => setEmergencyContactName(e.target.value)} required />
                  </div>
                  <div>
                    <label htmlFor="ec_phone">Contact phone</label>
                    <input id="ec_phone" type="tel" placeholder="0244000000" value={emergencyContactPhone} onChange={(e) => setEmergencyContactPhone(e.target.value)} required />
                  </div>
                </div>
              </>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <div className="pt-1">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </div>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Already have an account?{' '}
            <Link href="/login" className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
