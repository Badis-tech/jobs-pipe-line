-- Invoke the ingest-jobs edge function every 6 hours.
-- Remotive asks for at most ~4 API calls per day, so do not tighten this.
-- Requires a Vault secret named 'anon_key' (created out-of-band, not in a
-- migration) holding the project's legacy anon JWT.

select cron.schedule(
  'ingest-jobs-every-6h',
  '0 */6 * * *',
  $$
  select net.http_post(
    url := 'https://qhcqecodncwrpnlhullo.supabase.co/functions/v1/ingest-jobs',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'anon_key')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
  $$
);
