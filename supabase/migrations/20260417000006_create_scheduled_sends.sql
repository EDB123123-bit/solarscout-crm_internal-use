-- T-12: ScheduledSend table — thread_id is nullable (set after Step 0 sends)
CREATE TABLE public.scheduled_sends (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id   uuid        NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  step_index   smallint    NOT NULL CHECK (step_index IN (0, 1, 2)),
  scheduled_at timestamptz NOT NULL,
  sent_at      timestamptz,
  status       text        NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'sent', 'cancelled', 'failed')),
  thread_id    text
);

ALTER TABLE public.scheduled_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own scheduled sends"
  ON public.scheduled_sends
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.contacts
        JOIN public.campaigns ON campaigns.id = contacts.campaign_id
      WHERE contacts.id = scheduled_sends.contact_id
        AND campaigns.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contacts
        JOIN public.campaigns ON campaigns.id = contacts.campaign_id
      WHERE contacts.id = scheduled_sends.contact_id
        AND campaigns.user_id = auth.uid()
    )
  );
