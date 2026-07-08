-- Security hardening: lock down role assignment on the users table.
--
-- Before this migration, the self-service RLS policies let any authenticated
-- user (a) insert their own row with role = 'trainer', and (b) UPDATE their own
-- row to change role from 'client' to 'trainer' — a privilege escalation that
-- grants full trainer access (all client PII/medical data, refunds, and
-- withdrawals of platform funds). Trainers must be provisioned out-of-band.

-- 1) Self-service signup may only create CLIENT rows.
DROP POLICY IF EXISTS "users: insert own" ON users;
CREATE POLICY "users: insert own"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid() AND role = 'client');

-- 2) role is immutable after insert (blocks client -> trainer escalation).
--    Provision a trainer by INSERTing the row directly (service role / SQL
--    editor), not by updating an existing client.
CREATE OR REPLACE FUNCTION prevent_role_change()
RETURNS trigger AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'role is immutable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_role_immutable ON users;
CREATE TRIGGER users_role_immutable
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION prevent_role_change();
