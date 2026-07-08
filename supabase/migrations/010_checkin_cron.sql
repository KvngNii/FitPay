-- Monthly check-in cron: fires /api/ai/checkin on the 1st of each month for
-- all active clients (CLAUDE.md "AI Trigger 4"). This was documented but never
-- actually scheduled — only the USSD session cleanup cron existed until now.
--
-- Uses the "http" extension (already enabled in 001_initial_schema.sql), not
-- pg_net, since that's what this project has installed.
--
-- The internal secret and app URL are read from Postgres settings rather than
-- hardcoded here, so this file has no secret in it. Set them once via the
-- Supabase SQL editor (run as separate statements — NOT committed to a
-- migration file):
--
--   ALTER DATABASE postgres SET app.internal_api_secret = 'paste-the-secret-here';
--   ALTER DATABASE postgres SET app.app_url = 'https://your-fitpay-domain.vercel.app';
--
-- Then run `SELECT pg_reload_conf();` for the new settings to take effect.

SELECT cron.schedule(
  'monthly-client-checkin',
  '0 8 1 * *',  -- 08:00 UTC on the 1st of every month
  $$
  SELECT http((
    'POST',
    current_setting('app.app_url', true) || '/api/ai/checkin',
    ARRAY[
      http_header('Content-Type', 'application/json'),
      http_header('x-internal-secret', current_setting('app.internal_api_secret', true))
    ],
    'application/json',
    '{}'
  )::http_request);
  $$
);
