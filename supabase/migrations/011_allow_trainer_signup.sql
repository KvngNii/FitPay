-- Allow self-service signup to create trainer accounts too.
--
-- 009_security_hardening.sql restricted self-service INSERT to role='client'
-- only, in response to a privilege-escalation bug where an existing client
-- could change their own row's role to 'trainer'. That escalation path is
-- fully closed by the users_role_immutable trigger from that same migration
-- (role can never change after insert, regardless of what INSERT allows).
--
-- FitPay is a multi-tenant product where independent trainers are meant to
-- self-sign-up as paying customers (see pricing: Free up to 3 clients, Pro
-- GH₵99/month) — locking signup to clients only was stricter than the
-- product needs. Re-open INSERT to either role; the immutability trigger
-- keeps the original vulnerability closed.

DROP POLICY IF EXISTS "users: insert own" ON users;
CREATE POLICY "users: insert own"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid() AND role IN ('client', 'trainer'));
