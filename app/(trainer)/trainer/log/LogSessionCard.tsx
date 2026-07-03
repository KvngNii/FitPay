'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Difficulty, ExerciseEntry } from '@/types'

const EMPTY_EXERCISE: ExerciseEntry = {
  name: '',
  sets: 3,
  reps: 10,
  weight_kg: 0,
  difficulty: 'moderate',
  notes: '',
}

export type SessionToLog = {
  id: string
  scheduled_at: string
  notes: string | null
  client_name: string
  seedExercises: ExerciseEntry[]
}

export function LogSessionCard({ session }: { session: SessionToLog }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState(false)
  const [exercises, setExercises] = useState<ExerciseEntry[]>(
    session.seedExercises.length > 0 ? session.seedExercises : [EMPTY_EXERCISE]
  )
  const [overallDifficulty, setOverallDifficulty] = useState<Difficulty>('moderate')
  const [injuryFlag, setInjuryFlag] = useState(false)
  const [injuryNotes, setInjuryNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const date = new Date(session.scheduled_at)
  const dateStr = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  function updateExercise<K extends keyof ExerciseEntry>(index: number, key: K, value: ExerciseEntry[K]) {
    setExercises((prev) => prev.map((ex, i) => (i === index ? { ...ex, [key]: value } : ex)))
  }

  function addExercise() {
    setExercises((prev) => [...prev, { ...EMPTY_EXERCISE }])
  }

  function removeExercise(index: number) {
    setExercises((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const cleanedExercises = exercises
      .filter((ex) => ex.name.trim().length > 0)
      .map((ex) => ({ ...ex, notes: ex.notes?.trim() ? ex.notes.trim() : undefined }))

    if (cleanedExercises.length === 0) {
      setError('Add at least one exercise.')
      return
    }

    if (injuryFlag && !injuryNotes.trim()) {
      setError('Please describe the injury.')
      return
    }

    setLoading(true)

    const res = await fetch('/api/sessions/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: session.id,
        exercises: cleanedExercises,
        overall_difficulty: overallDifficulty,
        injury_flag: injuryFlag,
        injury_notes: injuryFlag ? injuryNotes.trim() : null,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Failed to log session')
      return
    }

    setDone(true)
    setOpen(false)
    router.refresh()
  }

  if (done) {
    return (
      <div className="card flex items-center justify-between">
        <div>
          <p className="font-medium text-slate-50">{session.client_name}</p>
          <p className="text-sm text-slate-400">{dateStr} · {timeStr}</p>
        </div>
        <span className="text-xs bg-emerald-900/40 text-emerald-400 px-2 py-1 rounded-full shrink-0">
          Logged
        </span>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-slate-50">{session.client_name}</p>
          <p className="text-sm text-slate-400">{dateStr} · {timeStr}</p>
          {session.notes && <p className="text-xs text-slate-500 mt-0.5">{session.notes}</p>}
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors shrink-0"
        >
          {open ? 'Hide' : 'Log workout'}
        </button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="mt-3 pt-3 border-t border-slate-800 space-y-4">
          <div className="space-y-3">
            <p className="text-xs font-medium text-slate-400">Exercises</p>
            {exercises.map((exercise, index) => (
              <div key={index} className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Exercise name"
                    value={exercise.name}
                    onChange={(e) => updateExercise(index, 'name', e.target.value)}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeExercise(index)}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors shrink-0"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-500">Sets</label>
                    <input
                      type="number" min="0" step="1"
                      value={exercise.sets}
                      onChange={(e) => updateExercise(index, 'sets', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500">Reps</label>
                    <input
                      type="number" min="0" step="1"
                      value={exercise.reps}
                      onChange={(e) => updateExercise(index, 'reps', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500">Weight (kg)</label>
                    <input
                      type="number" min="0" step="0.5"
                      value={exercise.weight_kg}
                      onChange={(e) => updateExercise(index, 'weight_kg', Number(e.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-500">Difficulty</label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {(['easy', 'moderate', 'hard'] as const).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => updateExercise(index, 'difficulty', d)}
                        className={`text-xs px-3 py-1.5 rounded-lg border capitalize transition-colors ${
                          exercise.difficulty === d
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                            : 'border-slate-700 text-slate-400'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Notes (optional)"
                  value={exercise.notes ?? ''}
                  onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                />
              </div>
            ))}

            <button
              type="button"
              onClick={addExercise}
              className="btn-secondary py-2 text-sm w-full"
            >
              + Add exercise
            </button>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-400 mb-1">Overall session difficulty</p>
            <div className="grid grid-cols-3 gap-2">
              {(['easy', 'moderate', 'hard'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setOverallDifficulty(d)}
                  className={`text-xs px-3 py-1.5 rounded-lg border capitalize transition-colors ${
                    overallDifficulty === d
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                      : 'border-slate-700 text-slate-400'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={injuryFlag}
              onChange={(e) => setInjuryFlag(e.target.checked)}
              className="w-4 h-4 rounded accent-emerald-500"
            />
            <span className="text-sm text-slate-300">Client reported injury</span>
          </label>

          {injuryFlag && (
            <input
              type="text"
              placeholder="Describe the injury"
              value={injuryNotes}
              onChange={(e) => setInjuryNotes(e.target.value)}
              required
            />
          )}

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary py-2 text-sm w-full">
            {loading ? 'Saving…' : 'Save log'}
          </button>
        </form>
      )}
    </div>
  )
}
