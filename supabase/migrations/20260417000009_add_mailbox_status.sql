-- T-17/T-22 prerequisite: track whether the OAuth token is still valid
ALTER TABLE public.mailbox_connections
  ADD COLUMN status text NOT NULL DEFAULT 'connected'
    CHECK (status IN ('connected', 'disconnected'));
