ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS company_roof_picture text,
  ADD COLUMN IF NOT EXISTS general_phone        text,
  ADD COLUMN IF NOT EXISTS website              text,
  ADD COLUMN IF NOT EXISTS nace_industry        text,
  ADD COLUMN IF NOT EXISTS contact_function     text,
  ADD COLUMN IF NOT EXISTS linkedin_url         text;
