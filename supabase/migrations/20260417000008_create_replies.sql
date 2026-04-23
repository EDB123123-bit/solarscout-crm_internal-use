-- T-14: Reply table
CREATE TABLE public.replies (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id     uuid        NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  received_at    timestamptz NOT NULL DEFAULT now(),
  body_text      text,
  raw_message_id text
);

ALTER TABLE public.replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage replies for their own contacts"
  ON public.replies
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.contacts
        JOIN public.campaigns ON campaigns.id = contacts.campaign_id
      WHERE contacts.id = replies.contact_id
        AND campaigns.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contacts
        JOIN public.campaigns ON campaigns.id = contacts.campaign_id
      WHERE contacts.id = replies.contact_id
        AND campaigns.user_id = auth.uid()
    )
  );
