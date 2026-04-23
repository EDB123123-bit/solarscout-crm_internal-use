-- Add user_agent to email_events for open tracking accuracy
-- Allows filtering Apple Mail Privacy Protection proxy opens
ALTER TABLE public.email_events
  ADD COLUMN IF NOT EXISTS user_agent text;
