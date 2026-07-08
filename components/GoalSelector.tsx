'use client'

import type { FitnessGoal } from '@/types'

const GOAL_OPTIONS: { value: FitnessGoal; label: string }[] = [
  { value: 'general', label: 'General fitness' },
  { value: 'weight_loss', label: 'Weight loss' },
  { value: 'strength', label: 'Strength' },
  { value: 'endurance', label: 'Endurance' },
]

// Multi-select fitness goals. `value` is always kept non-empty by the caller;
// the first entry (in GOAL_OPTIONS order) is the "primary" goal used by the
// progression engine and AI prompts.
export function GoalSelector({
  value,
  onChange,
}: {
  value: FitnessGoal[]
  onChange: (goals: FitnessGoal[]) => void
}) {
  function toggle(goal: FitnessGoal) {
    if (value.includes(goal)) {
      if (value.length === 1) return // keep at least one selected
      onChange(value.filter((g) => g !== goal))
    } else {
      // Keep selection in canonical GOAL_OPTIONS order so the "primary" goal
      // (goals[0]) is deterministic regardless of click order.
      onChange(GOAL_OPTIONS.map((o) => o.value).filter((g) => g === goal || value.includes(g)))
    }
  }

  return (
    <div>
      <label>Fitness goals</label>
      <p className="text-xs text-slate-500 mb-2 -mt-0.5">Select all that apply</p>
      <div className="grid grid-cols-2 gap-2">
        {GOAL_OPTIONS.map(({ value: goal, label }) => {
          const active = value.includes(goal)
          return (
            <button
              key={goal}
              type="button"
              onClick={() => toggle(goal)}
              aria-pressed={active}
              className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-all duration-200 ${
                active
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-600 hover:text-slate-300'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
