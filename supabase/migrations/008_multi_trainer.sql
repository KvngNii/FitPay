-- Multi-trainer isolation.
-- Link every client to a trainer and stamp trainer_id on purchases and refund
-- requests so each trainer view can scope to its owner. Sessions and
-- disbursements already carry trainer_id.

ALTER TABLE users           ADD COLUMN trainer_id uuid REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE purchases       ADD COLUMN trainer_id uuid REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE refund_requests ADD COLUMN trainer_id uuid REFERENCES users(id) ON DELETE SET NULL;

-- Backfill single-trainer history to the first trainer.
UPDATE users
  SET trainer_id = (SELECT id FROM users WHERE role = 'trainer' ORDER BY created_at LIMIT 1)
  WHERE role = 'client' AND trainer_id IS NULL;

UPDATE purchases p
  SET trainer_id = u.trainer_id
  FROM users u
  WHERE u.id = p.client_id AND p.trainer_id IS NULL;

UPDATE refund_requests r
  SET trainer_id = u.trainer_id
  FROM users u
  WHERE u.id = r.client_id AND r.trainer_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_trainer_id           ON users(trainer_id);
CREATE INDEX IF NOT EXISTS idx_purchases_trainer_id       ON purchases(trainer_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_trainer_id ON refund_requests(trainer_id);

-- ─────────────────────────────────────────────
-- Tighten RLS so a trainer only sees their own clients' data.
-- (Trainer pages use the service role and bypass RLS; these are defense in
--  depth and govern any anon or authenticated access.)
-- ─────────────────────────────────────────────

-- users: a trainer may read their own client rows only
DROP POLICY IF EXISTS "users: trainer read all" ON users;
CREATE POLICY "users: trainer read own clients" ON users
  FOR SELECT TO authenticated
  USING (get_user_role() = 'trainer' AND trainer_id = auth.uid());

-- purchases
DROP POLICY IF EXISTS "purchases: trainer read all" ON purchases;
CREATE POLICY "purchases: trainer read own" ON purchases
  FOR SELECT TO authenticated
  USING (get_user_role() = 'trainer' AND trainer_id = auth.uid());

DROP POLICY IF EXISTS "purchases: trainer update" ON purchases;
CREATE POLICY "purchases: trainer update own" ON purchases
  FOR UPDATE TO authenticated
  USING (get_user_role() = 'trainer' AND trainer_id = auth.uid());

-- sessions
DROP POLICY IF EXISTS "sessions: trainer read all" ON sessions;
CREATE POLICY "sessions: trainer read own" ON sessions
  FOR SELECT TO authenticated
  USING (get_user_role() = 'trainer' AND trainer_id = auth.uid());

DROP POLICY IF EXISTS "sessions: trainer write" ON sessions;
CREATE POLICY "sessions: trainer write own" ON sessions
  FOR ALL TO authenticated
  USING (get_user_role() = 'trainer' AND trainer_id = auth.uid());

-- workout_logs (keyed by session)
DROP POLICY IF EXISTS "workout_logs: trainer read all" ON workout_logs;
CREATE POLICY "workout_logs: trainer read own" ON workout_logs
  FOR SELECT TO authenticated
  USING (get_user_role() = 'trainer' AND EXISTS (
    SELECT 1 FROM sessions s WHERE s.id = workout_logs.session_id AND s.trainer_id = auth.uid()
  ));

DROP POLICY IF EXISTS "workout_logs: trainer write" ON workout_logs;
CREATE POLICY "workout_logs: trainer write own" ON workout_logs
  FOR ALL TO authenticated
  USING (get_user_role() = 'trainer' AND EXISTS (
    SELECT 1 FROM sessions s WHERE s.id = workout_logs.session_id AND s.trainer_id = auth.uid()
  ));

-- progression_rules (keyed by client)
DROP POLICY IF EXISTS "progression_rules: trainer read all" ON progression_rules;
CREATE POLICY "progression_rules: trainer read own" ON progression_rules
  FOR SELECT TO authenticated
  USING (get_user_role() = 'trainer' AND EXISTS (
    SELECT 1 FROM users u WHERE u.id = progression_rules.client_id AND u.trainer_id = auth.uid()
  ));

DROP POLICY IF EXISTS "progression_rules: trainer write" ON progression_rules;
CREATE POLICY "progression_rules: trainer write own" ON progression_rules
  FOR ALL TO authenticated
  USING (get_user_role() = 'trainer' AND EXISTS (
    SELECT 1 FROM users u WHERE u.id = progression_rules.client_id AND u.trainer_id = auth.uid()
  ));

-- medical_history (keyed by client)
DROP POLICY IF EXISTS "medical_history: trainer read all" ON medical_history;
CREATE POLICY "medical_history: trainer read own" ON medical_history
  FOR SELECT TO authenticated
  USING (get_user_role() = 'trainer' AND EXISTS (
    SELECT 1 FROM users u WHERE u.id = medical_history.client_id AND u.trainer_id = auth.uid()
  ));

DROP POLICY IF EXISTS "medical_history: trainer update" ON medical_history;
CREATE POLICY "medical_history: trainer update own" ON medical_history
  FOR UPDATE TO authenticated
  USING (get_user_role() = 'trainer' AND EXISTS (
    SELECT 1 FROM users u WHERE u.id = medical_history.client_id AND u.trainer_id = auth.uid()
  ));

-- refund_requests
DROP POLICY IF EXISTS "trainers_see_all_refund_requests" ON refund_requests;
CREATE POLICY "trainers_see_own_refund_requests" ON refund_requests
  FOR SELECT TO authenticated
  USING (get_user_role() = 'trainer' AND trainer_id = auth.uid());
