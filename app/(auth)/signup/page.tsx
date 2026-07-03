'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { FitnessGoal, FitnessLevel, Gender, UserRole } from '@/types'

export default function SignupPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('client')
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

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

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
      goal: role === 'client' ? goal : null,
      fitness_level: role === 'client' ? fitnessLevel : null,
      date_of_birth: role === 'client' && dateOfBirth ? dateOfBirth : null,
      gender: role === 'client' ? gender : null,
      height_cm: role === 'client' && heightCm ? Number(heightCm) : null,
      weight_kg: role === 'client' && weightKg ? Number(weightKg) : null,
      emergency_contact_name: role === 'client' ? emergencyContactName : null,
      emergency_contact_phone: role === 'client' ? emergencyContactPhone : null,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    // Clients must complete the medical history intake before training begins.
    // The onboarding AI trigger fires after that step, once injuries are known.
    const dest = role === 'trainer' ? '/trainer/dashboard' : '/onboarding/medical-history'
    router.push(dest)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-emerald-400">FitPay</h1>
          <p className="text-slate-400 mt-2 text-sm">Create your account</p>
        </div>

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

          <div>
            <label>I am a</label>
            <div className="grid grid-cols-2 gap-3 mt-1">
              {(['client', 'trainer'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-3 rounded-lg border font-medium capitalize transition-colors ${
                    role === r
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                      : 'border-slate-700 bg-slate-800 text-slate-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {role === 'client' && (
            <>
              <div className="pt-2 border-t border-slate-800">
                <p className="text-sm font-semibold text-slate-300 mt-3 mb-1">Training profile</p>
              </div>

              <div>
                <label htmlFor="goal">Fitness goal</label>
                <select
                  id="goal"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value as FitnessGoal)}
                >
                  <option value="general">General fitness</option>
                  <option value="weight_loss">Weight loss</option>
                  <option value="strength">Strength</option>
                  <option value="endurance">Endurance</option>
                </select>
              </div>

              <div>
                <label htmlFor="fitness_level">Fitness level</label>
                <select
                  id="fitness_level"
                  value={fitnessLevel}
                  onChange={(e) => setFitnessLevel(e.target.value as FitnessLevel)}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="dob">Date of birth</label>
                  <input
                    id="dob"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="gender">Gender</label>
                  <select
                    id="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                  >
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
                    id="height"
                    type="number"
                    placeholder="170"
                    min="50"
                    max="250"
                    step="0.1"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="weight">Weight (kg)</label>
                  <input
                    id="weight"
                    type="number"
                    placeholder="70"
                    min="20"
                    max="300"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <p className="text-sm font-semibold text-slate-300 mt-3 mb-1">Emergency contact</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="ec_name">Contact name</label>
                  <input
                    id="ec_name"
                    type="text"
                    placeholder="Ama Mensah"
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="ec_phone">Contact phone</label>
                  <input
                    id="ec_phone"
                    type="tel"
                    placeholder="0244000000"
                    value={emergencyContactPhone}
                    onChange={(e) => setEmergencyContactPhone(e.target.value)}
                    required
                  />
                </div>
              </div>
            </>
          )}

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-emerald-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
