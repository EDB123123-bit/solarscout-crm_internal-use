-- T-13: EmailEvent table
CREATE TABLE public.email_events (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id  uuid        NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  step_index  smallint    NOT NULL CHECK (step_index IN (0, 1, 2)),
  event_type  text        NOT NULL CHECK (event_type IN ('sent', 'opened', 'replied')),
  timestamp   timestamptz NOT NULL DEFAULT now(),
  message_id  text
);

ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage email events for their own contacts"
  ON public.email_events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.contacts
        JOIN public.campaigns ON campaigns.id = contacts.campaign_id
      WHERE contacts.id = email_events.contact_id
        AND campaigns.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contacts
        JOIN public.campaigns ON campaigns.id = contacts.campaign_id
      WHERE contacts.id = email_events.contact_id
        AND campaigns.user_id = auth.uid()
    )
  );
