-- Allow clients to select multiple fitness goals.
--
-- `goal` remains a single "primary" goal (the first one selected), used by
-- the deterministic progression engine and AI prompts, which reason about
-- one goal at a time. `goals` stores the full multi-select for display
-- (profile, trainer roster) and is written alongside `goal` wherever the
-- client's goals are set or edited.
ALTER TABLE users ADD COLUMN IF NOT EXISTS goals fitness_goal[] NOT NULL DEFAULT '{}';
