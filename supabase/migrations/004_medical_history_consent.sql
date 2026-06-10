-- Add PAR-Q consent acknowledgement + 12-month validity tracking
ALTER TABLE medical_history
  ADD COLUMN IF NOT EXISTS consent_acknowledged    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_acknowledged_at timestamptz,
  ADD COLUMN IF NOT EXISTS valid_until timestamptz GENERATED ALWAYS AS (consent_acknowledged_at + interval '1 year') STORED;
