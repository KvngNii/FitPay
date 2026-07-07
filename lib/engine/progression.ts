// Rules engine - runs after every completed session.
// Claude is NEVER called here. This is purely deterministic logic.
import type { ExerciseEntry, FitnessGoal, ProgressionRule, WorkoutLog } from '@/types'

type EngineInput = {
  client_id: string
  last_workout_log: WorkoutLog
  progression_rules: ProgressionRule
}

type EngineOutput = {
  next_plan: ExerciseEntry[]
  updated_rules: Pick<ProgressionRule, 'sessions_in_phase' | 'current_phase' | 'last_updated'>
}

// Muscle group rotation order
const ROTATION: Record<FitnessGoal, string[]> = {
  weight_loss: ['full_body', 'upper', 'lower', 'full_body'],
  strength:    ['push', 'pull', 'legs', 'push'],
  endurance:   ['circuit_upper', 'circuit_lower', 'circuit_full', 'circuit_upper'],
  general:     ['push', 'pull', 'legs', 'full_body'],
}

function applyProgression(exercise: ExerciseEntry, goal: FitnessGoal): ExerciseEntry {
  const { difficulty } = exercise

  if (difficulty === 'easy') {
    if (goal === 'strength') {
      return { ...exercise, weight_kg: exercise.weight_kg + 2.5 }
    }
    return { ...exercise, reps: exercise.reps + 2 }
  }

  if (difficulty === 'hard') {
    return { ...exercise, reps: Math.max(1, exercise.reps - 1) }
  }

  // moderate - hold
  return { ...exercise }
}

function buildDeloadSession(exercises: ExerciseEntry[]): ExerciseEntry[] {
  return exercises.map((ex) => ({
    ...ex,
    weight_kg: parseFloat((ex.weight_kg * 0.6).toFixed(2)),
    difficulty: 'easy' as const,
  }))
}

export function runProgressionEngine(input: EngineInput): EngineOutput {
  const { last_workout_log, progression_rules } = input
  const { goal, sessions_in_phase, deload_every_n } = progression_rules

  const isDeload = sessions_in_phase >= deload_every_n

  let next_plan: ExerciseEntry[]

  if (isDeload) {
    next_plan = buildDeloadSession(last_workout_log.exercises)
  } else {
    next_plan = last_workout_log.exercises.map((ex) =>
      applyProgression(ex, goal)
    )
  }

  const newSessionsInPhase = isDeload ? 0 : sessions_in_phase + 1

  const rotationIndex = newSessionsInPhase % ROTATION[goal].length
  const currentPhase = ROTATION[goal][rotationIndex]

  return {
    next_plan,
    updated_rules: {
      sessions_in_phase: newSessionsInPhase,
      current_phase: currentPhase,
      last_updated: new Date().toISOString(),
    },
  }
}
