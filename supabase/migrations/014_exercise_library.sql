-- Exercise reference library, seeded from a third-party dataset (name, target
-- muscles, equipment, and a technique GIF per exercise). Read-only reference
-- data: trainers and clients both browse it, only the seed script (service
-- role) ever writes to it.
CREATE TABLE exercises (
  id              text PRIMARY KEY,
  name            text NOT NULL,
  category        text NOT NULL,
  body_part       text NOT NULL,
  equipment       text NOT NULL,
  target          text,
  muscle_group    text,
  secondary_muscles text[] NOT NULL DEFAULT '{}',
  instructions    text,
  image_url       text,
  gif_url         text,
  attribution     text NOT NULL DEFAULT '© Gym visual — https://gymvisual.com/',
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX exercises_name_idx ON exercises USING gin (to_tsvector('english', name));
CREATE INDEX exercises_body_part_idx ON exercises (body_part);

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- Every signed-in user (client or trainer) can browse the library. Nobody
-- writes to it through the client - only the seed script, via service role.
CREATE POLICY "exercises: authenticated read"
  ON exercises FOR SELECT
  TO authenticated
  USING (true);
