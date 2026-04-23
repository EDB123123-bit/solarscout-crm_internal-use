-- T-08: MailboxConnection table
CREATE TABLE public.mailbox_connections (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider        text        NOT NULL CHECK (provider IN ('gmail', 'outlook')),
  access_token    text        NOT NULL,
  refresh_token   text        NOT NULL,
  email_address   text        NOT NULL,
  token_expires_at timestamptz NOT NULL,
  connected_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mailbox_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own mailbox connections"
  ON public.mailbox_connections
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
