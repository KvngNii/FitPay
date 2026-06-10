-- Add PAR-Q consent acknowledgement + 12-month validity tracking
-- (valid_until is set by the application, not generated, since
-- timestamptz + interval arithmetic is not immutable in Postgres)
ALTER TABLE medical_history
  ADD COLUMN IF NOT EXISTS consent_acknowledged    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_acknowledged_at timestamptz,
  ADD COLUMN IF NOT EXISTS valid_until             timestamptz;
