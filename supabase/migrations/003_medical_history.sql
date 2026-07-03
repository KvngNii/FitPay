-- ─────────────────────────────────────────────
-- MEDICAL HISTORY / PAR-Q INTAKE
-- Required step after signup, before training begins.
-- ─────────────────────────────────────────────
CREATE TABLE medical_history (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id   uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- PAR-Q (Physical Activity Readiness Questionnaire) screening
  heart_condition_or_bp        boolean NOT NULL DEFAULT false,
  chest_pain                   boolean NOT NULL DEFAULT false,
  dizziness_or_consciousness   boolean NOT NULL DEFAULT false,
  chronic_condition            boolean NOT NULL DEFAULT false,
  chronic_condition_details    text,
  prescribed_medication        boolean NOT NULL DEFAULT false,
  medication_details           text,
  bone_or_joint_problem        boolean NOT NULL DEFAULT false,
  bone_or_joint_details         text,

  -- Injury & condition history
  previous_injuries_surgeries  text,
  current_pain_areas           text,
  allergies                    text,
  additional_notes             text,

  -- Derived flag: true if any PAR-Q answer requires medical clearance
  needs_medical_clearance boolean GENERATED ALWAYS AS (
    heart_condition_or_bp OR chest_pain OR dizziness_or_consciousness OR
    chronic_condition OR prescribed_medication OR bone_or_joint_problem
  ) STORED,

  -- Trainer sign-off
  trainer_reviewed     boolean NOT NULL DEFAULT false,
  trainer_reviewed_at  timestamptz,
  trainer_notes        text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_medical_history_client_id ON medical_history(client_id);

ALTER TABLE medical_history ENABLE ROW LEVEL SECURITY;

-- Clients can read, create, and update their own medical history
CREATE POLICY "medical_history: client read own"
  ON medical_history FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "medical_history: client insert own"
  ON medical_history FOR INSERT
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "medical_history: client update own"
  ON medical_history FOR UPDATE
  USING (client_id = auth.uid());

-- Trainers can read and update (review) all medical history
CREATE POLICY "medical_history: trainer read all"
  ON medical_history FOR SELECT
  USING (get_user_role() = 'trainer');

CREATE POLICY "medical_history: trainer update"
  ON medical_history FOR UPDATE
  USING (get_user_role() = 'trainer');
