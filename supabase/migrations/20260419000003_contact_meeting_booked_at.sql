-- T-56: Add meeting_booked_at timestamp to contacts for lead timeline
alter table public.contacts
  add column if not exists meeting_booked_at timestamptz;
