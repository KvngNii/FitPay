-- A client account created in the gap between 008_multi_trainer.sql running
-- (which backfilled trainer_id for clients that existed AT THAT TIME) and the
-- trainer-picker signup flow shipping ended up with trainer_id left NULL.
-- That makes the client, their purchases, and their refund requests invisible
-- to every trainer-scoped query and RLS policy (earnings, sessions, refund
-- approvals all filter on trainer_id = auth.uid(), and NULL never matches).
--
-- Backfill any remaining NULL trainer_id the same way 008 did: to the
-- earliest trainer account. Safe to re-run — every UPDATE is guarded by
-- `WHERE trainer_id IS NULL`, so it only touches rows still unassigned.

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
