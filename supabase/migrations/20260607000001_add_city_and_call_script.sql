-- Add city to contacts
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS city text;

-- Add call script template to sequence_steps
ALTER TABLE public.sequence_steps
  ADD COLUMN IF NOT EXISTS call_script_template text;
