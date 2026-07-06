-- Add session-level granularity to refund requests.
-- Clients can now request a refund for a specific number of sessions
-- rather than the full package. The amount_ghs is pro-rated on insert.

ALTER TABLE refund_requests
  ADD COLUMN sessions_requested int NOT NULL DEFAULT 1;
