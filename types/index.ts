// Enums
export type UserRole = 'client' | 'trainer'
export type FitnessGoal = 'weight_loss' | 'strength' | 'endurance' | 'general'
export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced'
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say'
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
  date_of_birth: string | null
  gender: Gender | null
  height_cm: number | null
  weight_kg: number | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  created_at: string
}

export type MedicalHistory = {
  id: string
  client_id: string
  heart_condition_or_bp: boolean
  chest_pain: boolean
  dizziness_or_consciousness: boolean
  chronic_condition: boolean
  chronic_condition_details: string | null
  prescribed_medication: boolean
  medication_details: string | null
  bone_or_joint_problem: boolean
  bone_or_joint_details: string | null
  previous_injuries_surgeries: string | null
  current_pain_areas: string | null
  allergies: string | null
  additional_notes: string | null
  needs_medical_clearance: boolean
  consent_acknowledged: boolean
  consent_acknowledged_at: string | null
  valid_until: string | null
  trainer_reviewed: boolean
  trainer_reviewed_at: string | null
  trainer_notes: string | null
  created_at: string
  updated_at: string
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
  initial_plan: ExerciseEntry[] | null
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

// USSD request — what Moolre POSTs to /api/ussd/callback
export type UssdRequest = {
  sessionId: string
  new: boolean | string  // true/false or "true"/"false" — real phones send string
  msisdn: string     // caller's phone number e.g. "233241235993"
  network: number    // 3=MTN, 5=AT, 6=Telecel
  message: string    // what the user typed at this step
  extension: string  // your assigned USSD code e.g. "109"
  data: string       // extra data from dial string e.g. *203*109*11005# → data="11005"
}

// USSD response — what we send back to Moolre
export type UssdResponse = {
  message: string   // menu text to display
  reply: boolean    // true = continue session, false = end session
}

// Moolre payment link response data
export type MoolrePaymentLinkData = {
  authorization_url: string
  reference: string
}

// Moolre webhook payload
export type MoolreWebhookPayload = {
  status: number
  code: string
  message: string
  data: {
    txstatus: number
    payer: string
    terminalid: string
    accountnumber: string
    name: string
    amount: string
    value: string
    transactionid: string
    externalref: string
    thirdpartyref: string
    secret: string
    ts: string
  }
}
