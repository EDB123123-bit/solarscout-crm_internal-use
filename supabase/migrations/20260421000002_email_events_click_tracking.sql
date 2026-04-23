-- Extend email_events for click tracking and proxy open detection
-- Drop old CHECK constraint and replace with expanded one
ALTER TABLE public.email_events
  DROP CONSTRAINT IF EXISTS email_events_event_type_check;

ALTER TABLE public.email_events
  ADD CONSTRAINT email_events_event_type_check
  CHECK (event_type IN ('sent', 'opened', 'opened_proxy', 'clicked', 'replied'));

-- Store the clicked URL
ALTER TABLE public.email_events
  ADD COLUMN IF NOT EXISTS url text;
