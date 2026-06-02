-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "http";

-- ─────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('client', 'trainer');
CREATE TYPE fitness_goal AS ENUM ('weight_loss', 'strength', 'endurance', 'general');
CREATE TYPE fitness_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE purchase_status AS ENUM ('pending', 'active', 'expired', 'refunded');
CREATE TYPE session_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
CREATE TYPE difficulty_level AS ENUM ('easy', 'moderate', 'hard');
CREATE TYPE disbursement_type AS ENUM ('withdrawal', 'refund');
CREATE TYPE disbursement_status AS ENUM ('pending', 'success', 'failed');

-- ─────────────────────────────────────────────
-- TABLES
-- ─────────────────────────────────────────────

CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          text NOT NULL,
  phone         text UNIQUE NOT NULL,
  email         text UNIQUE,
  role          user_role NOT NULL,
  goal          fitness_goal,
  fitness_level fitness_level,
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE packages (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          text NOT NULL,
  sessions      int NOT NULL,
  price_ghs     decimal(10,2) NOT NULL,
  duration_days int NOT NULL,
  is_active     boolean DEFAULT true
);

CREATE TABLE purchases (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  package_id    uuid NOT NULL REFERENCES packages(id),
  moolre_ref    text UNIQUE NOT NULL,
  status        purchase_status NOT NULL DEFAULT 'pending',
  sessions_left int NOT NULL,
  expires_at    timestamptz,
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE sessions (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trainer_id    uuid NOT NULL REFERENCES users(id),
  purchase_id   uuid NOT NULL REFERENCES purchases(id),
  scheduled_at  timestamptz NOT NULL,
  status        session_status NOT NULL DEFAULT 'scheduled',
  notes         text,
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE workout_logs (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id          uuid UNIQUE NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  exercises           jsonb NOT NULL,
  overall_difficulty  difficulty_level NOT NULL,
  injury_flag         boolean DEFAULT false,
  injury_notes        text,
  next_plan           jsonb,
  ai_generated        boolean DEFAULT false,
  created_at          timestamptz DEFAULT now()
);

CREATE TABLE progression_rules (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id         uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal              fitness_goal NOT NULL,
  current_phase     text,
  sessions_in_phase int DEFAULT 0,
  deload_every_n    int DEFAULT 4,
  last_updated      timestamptz DEFAULT now()
);

CREATE TABLE disbursements (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id      uuid NOT NULL REFERENCES users(id),
  amount_ghs      decimal(10,2) NOT NULL,
  type            disbursement_type NOT NULL,
  recipient_phone text NOT NULL,
  moolre_ref      text UNIQUE,
  status          disbursement_status NOT NULL DEFAULT 'pending',
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE ussd_sessions (
  session_id    text PRIMARY KEY,
  phone         text NOT NULL,
  client_id     uuid REFERENCES users(id),
  current_state text NOT NULL,
  session_data  jsonb DEFAULT '{}',
  expires_at    timestamptz NOT NULL,
  created_at    timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────
CREATE INDEX idx_purchases_client_id       ON purchases(client_id);
CREATE INDEX idx_sessions_client_id        ON sessions(client_id);
CREATE INDEX idx_sessions_scheduled_at     ON sessions(scheduled_at);
CREATE INDEX idx_workout_logs_session_id   ON workout_logs(session_id);
CREATE INDEX idx_ussd_sessions_expires_at  ON ussd_sessions(expires_at);

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────

ALTER TABLE users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases         ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE progression_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE disbursements     ENABLE ROW LEVEL SECURITY;
ALTER TABLE ussd_sessions     ENABLE ROW LEVEL SECURITY;

-- ─── Helper function: get caller's role ───────
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$;

-- ─── users ────────────────────────────────────
-- Users can read and update only their own row
CREATE POLICY "users: self read"
  ON users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "users: self update"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- Trainers can read all users (needed to manage clients)
CREATE POLICY "users: trainer read all"
  ON users FOR SELECT
  USING (get_user_role() = 'trainer');

-- Allow insert during signup (service role handles this)
CREATE POLICY "users: insert own"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());

-- ─── packages ─────────────────────────────────
-- Everyone can read active packages
CREATE POLICY "packages: read active"
  ON packages FOR SELECT
  USING (is_active = true);

-- Only trainers can manage packages
CREATE POLICY "packages: trainer all"
  ON packages FOR ALL
  USING (get_user_role() = 'trainer');

-- ─── purchases ────────────────────────────────
-- Clients see only their own purchases
CREATE POLICY "purchases: client read own"
  ON purchases FOR SELECT
  USING (client_id = auth.uid());

-- Trainers see all purchases
CREATE POLICY "purchases: trainer read all"
  ON purchases FOR SELECT
  USING (get_user_role() = 'trainer');

-- Trainers can update purchase status
CREATE POLICY "purchases: trainer update"
  ON purchases FOR UPDATE
  USING (get_user_role() = 'trainer');

-- ─── sessions ─────────────────────────────────
-- Clients see only their own sessions
CREATE POLICY "sessions: client read own"
  ON sessions FOR SELECT
  USING (client_id = auth.uid());

-- Trainers see all sessions
CREATE POLICY "sessions: trainer read all"
  ON sessions FOR SELECT
  USING (get_user_role() = 'trainer');

-- Trainers can insert/update/delete sessions
CREATE POLICY "sessions: trainer write"
  ON sessions FOR ALL
  USING (get_user_role() = 'trainer');

-- ─── workout_logs ─────────────────────────────
-- Clients see logs for their own sessions
CREATE POLICY "workout_logs: client read own"
  ON workout_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = workout_logs.session_id
        AND s.client_id = auth.uid()
    )
  );

-- Trainers see all workout logs
CREATE POLICY "workout_logs: trainer read all"
  ON workout_logs FOR SELECT
  USING (get_user_role() = 'trainer');

-- Trainers can insert/update workout logs
CREATE POLICY "workout_logs: trainer write"
  ON workout_logs FOR ALL
  USING (get_user_role() = 'trainer');

-- ─── progression_rules ────────────────────────
-- Clients see only their own progression rules
CREATE POLICY "progression_rules: client read own"
  ON progression_rules FOR SELECT
  USING (client_id = auth.uid());

-- Trainers see all progression rules
CREATE POLICY "progression_rules: trainer read all"
  ON progression_rules FOR SELECT
  USING (get_user_role() = 'trainer');

-- Trainers manage all progression rules
CREATE POLICY "progression_rules: trainer write"
  ON progression_rules FOR ALL
  USING (get_user_role() = 'trainer');

-- ─── disbursements ────────────────────────────
-- Only the trainer can see disbursements
CREATE POLICY "disbursements: trainer only"
  ON disbursements FOR ALL
  USING (
    trainer_id = auth.uid()
    AND get_user_role() = 'trainer'
  );

-- ─── ussd_sessions ────────────────────────────
-- No direct client/trainer access — service role only (handled server-side)
-- The DENY-ALL policy is implicit when RLS is enabled with no permissive policies.
-- Server API routes use the service role key which bypasses RLS.
CREATE POLICY "ussd_sessions: deny all"
  ON ussd_sessions FOR ALL
  USING (false);

-- ─────────────────────────────────────────────
-- USSD SESSION CLEANUP (via pg_cron)
-- Runs every 5 minutes to purge expired USSD sessions
-- ─────────────────────────────────────────────
SELECT cron.schedule(
  'ussd-session-cleanup',
  '*/5 * * * *',
  $$DELETE FROM ussd_sessions WHERE expires_at < now()$$
);
