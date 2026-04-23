-- T-47: pg_cron job to call /api/send every 5 minutes
--
-- Prerequisites (run once in Supabase SQL editor after deployment):
--
--   alter database postgres set "app.settings.site_url" to 'https://<your-app>.vercel.app';
--   alter database postgres set "app.settings.cron_secret" to '<your-cron-secret>';
--
-- The CRON_SECRET value must also be set as an env var in your deployment.
-- pg_net is used to make outbound HTTP calls from pg_cron.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'sot-send-queue',
  '*/5 * * * *',
  $$
  select net.http_post(
    url        := current_setting('app.settings.site_url') || '/api/send',
    headers    := jsonb_build_object(
                    'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret'),
                    'Content-Type',  'application/json'
                  ),
    body       := '{}'::jsonb
  );
  $$
);
