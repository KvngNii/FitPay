-- Add detailed profile fields collected at signup
-- (medical/injury history is collected separately — see 003_medical_history.sql)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS date_of_birth          date,
  ADD COLUMN IF NOT EXISTS gender                 text,
  ADD COLUMN IF NOT EXISTS height_cm              decimal(5,1),
  ADD COLUMN IF NOT EXISTS weight_kg              decimal(5,1),
  ADD COLUMN IF NOT EXISTS emergency_contact_name text,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone text;

-- Drop health_notes if it was already created by a previous run of this migration
ALTER TABLE users DROP COLUMN IF EXISTS health_notes;
