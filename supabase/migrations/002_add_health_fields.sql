-- Add detailed health & profile fields collected at signup
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS date_of_birth          date,
  ADD COLUMN IF NOT EXISTS gender                 text,
  ADD COLUMN IF NOT EXISTS height_cm              decimal(5,1),
  ADD COLUMN IF NOT EXISTS weight_kg              decimal(5,1),
  ADD COLUMN IF NOT EXISTS health_notes           text,
  ADD COLUMN IF NOT EXISTS emergency_contact_name text,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone text;
