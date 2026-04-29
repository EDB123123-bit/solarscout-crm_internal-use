-- Recent schema additions previously applied via Supabase MCP but missing from migration history.
-- Idempotent: safe to apply on environments where columns/constraints already exist.

-- campaigns: configurable send window (CET hours)
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS send_hour_start integer NOT NULL DEFAULT 8,
  ADD COLUMN IF NOT EXISTS send_hour_end   integer NOT NULL DEFAULT 18;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaigns_send_hour_start_check') THEN
    ALTER TABLE public.campaigns
      ADD CONSTRAINT campaigns_send_hour_start_check CHECK (send_hour_start >= 6 AND send_hour_start <= 20);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaigns_send_hour_end_check') THEN
    ALTER TABLE public.campaigns
      ADD CONSTRAINT campaigns_send_hour_end_check CHECK (send_hour_end >= 6 AND send_hour_end <= 20);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaigns_send_hour_window_check') THEN
    ALTER TABLE public.campaigns
      ADD CONSTRAINT campaigns_send_hour_window_check CHECK (send_hour_end > send_hour_start);
  END IF;
END $$;

-- sequence_steps: unified email/linkedin/phone steps + LinkedIn message template
ALTER TABLE public.sequence_steps
  ADD COLUMN IF NOT EXISTS step_type                 text NOT NULL DEFAULT 'email',
  ADD COLUMN IF NOT EXISTS linkedin_message_template text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sequence_steps_step_type_check') THEN
    ALTER TABLE public.sequence_steps
      ADD CONSTRAINT sequence_steps_step_type_check CHECK (step_type IN ('email', 'linkedin', 'phone'));
  END IF;
END $$;

-- Drop the legacy CHECK that limited step_index to (0,1,2). Unified sequence allows arbitrary indexes.
ALTER TABLE public.sequence_steps DROP CONSTRAINT IF EXISTS sequence_steps_step_index_check;

-- contact_tasks: optional notes captured on completion
ALTER TABLE public.contact_tasks
  ADD COLUMN IF NOT EXISTS notes text;
