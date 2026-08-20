-- Monthly check-in cron: fires /api/ai/checkin on the 1st of each month for
-- all active clients (CLAUDE.md "AI Trigger 4"). This was documented but never
-- actually scheduled — only the USSD session cleanup cron existed until now.
--
-- Uses the "http" extension (already enabled in 001_initial_schema.sql), not
-- pg_net, since that's what this project has installed.
--
-- Supabase's managed "postgres" role is not a true superuser, so
-- `ALTER DATABASE ... SET app.foo = ...` is rejected with a permission error.
-- The secret must instead be stored in Supabase Vault, which pg_cron jobs can
-- read at call time. Run this BEFORE the cron.schedule() below, once, via the
-- Supabase SQL editor (replace the placeholder with the real secret):
--
--   SELECT vault.create_secret(
--     'REPLACE_WITH_INTERNAL_API_SECRET',
--     'internal_api_secret',
--     'Shared secret for FitPay internal API routes'
--   );
--
-- The app URL is not sensitive, so it is inlined directly below — replace
-- YOUR_APP_URL_HERE with your real deployed domain before running this file.

SELECT cron.schedule(
  'monthly-client-checkin',
  '0 8 1 * *',  -- 08:00 UTC on the 1st of every month
  $$
  SELECT http((
    'POST',
    'YOUR_APP_URL_HERE/api/ai/checkin',
    ARRAY[
      http_header('Content-Type', 'application/json'),
      http_header(
        'x-internal-secret',
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'internal_api_secret')
      )
    ],
    'application/json',
    '{}'
  )::http_request);
  $$
);
