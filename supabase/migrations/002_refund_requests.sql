-- Refund request workflow: clients request, trainers approve or reject.
-- The actual Moolre transfer only fires when the trainer approves.

CREATE TYPE refund_request_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE refund_requests (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id   uuid NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  client_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_ghs    decimal(10,2) NOT NULL,
  network       text NOT NULL,
  status        refund_request_status NOT NULL DEFAULT 'pending',
  requested_at  timestamptz DEFAULT now(),
  resolved_at   timestamptz
);

ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;

-- Clients see only their own requests
CREATE POLICY "clients_see_own_refund_requests" ON refund_requests
  FOR SELECT TO authenticated
  USING (client_id = auth.uid());

-- Trainers see all requests
CREATE POLICY "trainers_see_all_refund_requests" ON refund_requests
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'trainer'
  ));

-- Clients can create requests for their own purchases
CREATE POLICY "clients_create_refund_requests" ON refund_requests
  FOR INSERT TO authenticated
  WITH CHECK (client_id = auth.uid());
