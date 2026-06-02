// Enums
export type UserRole = 'client' | 'trainer'
export type FitnessGoal = 'weight_loss' | 'strength' | 'endurance' | 'general'
export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced'
export type PurchaseStatus = 'pending' | 'active' | 'expired' | 'refunded'
export type SessionStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show'
export type Difficulty = 'easy' | 'moderate' | 'hard'
export type DisbursementType = 'withdrawal' | 'refund'
export type DisbursementStatus = 'pending' | 'success' | 'failed'

// Database tables
export type User = {
  id: string
  name: string
  phone: string
  email: string | null
  role: UserRole
  goal: FitnessGoal | null
  fitness_level: FitnessLevel | null
  created_at: string
}

export type Package = {
  id: string
  name: string
  sessions: number
  price_ghs: number
  duration_days: number
  is_active: boolean
}

export type Purchase = {
  id: string
  client_id: string
  package_id: string
  moolre_ref: string
  status: PurchaseStatus
  sessions_left: number
  expires_at: string | null
  created_at: string
}

export type Session = {
  id: string
  client_id: string
  trainer_id: string
  purchase_id: string
  scheduled_at: string
  status: SessionStatus
  notes: string | null
  created_at: string
}

export type ExerciseEntry = {
  name: string
  sets: number
  reps: number
  weight_kg: number
  difficulty: Difficulty
  notes?: string
}

export type WorkoutLog = {
  id: string
  session_id: string
  exercises: ExerciseEntry[]
  overall_difficulty: Difficulty
  injury_flag: boolean
  injury_notes: string | null
  next_plan: ExerciseEntry[] | null
  ai_generated: boolean
  created_at: string
}

export type ProgressionRule = {
  id: string
  client_id: string
  goal: FitnessGoal
  current_phase: string | null
  sessions_in_phase: number
  deload_every_n: number
  last_updated: string
}

export type Disbursement = {
  id: string
  trainer_id: string
  amount_ghs: number
  type: DisbursementType
  recipient_phone: string
  moolre_ref: string | null
  status: DisbursementStatus
  created_at: string
}

export type UssdSession = {
  session_id: string
  phone: string
  client_id: string | null
  current_state: string
  session_data: Record<string, unknown>
  expires_at: string
  created_at: string
}

// Moolre API response wrapper
export type MoolreResponse<T = unknown> = {
  status: 0 | 1
  code: string
  message: string
  data: T
  go: string | null
}

// Moolre USSD response
export type UssdResponse = {
  session_operation: 'continue' | 'end'
  session_msg: string
}
