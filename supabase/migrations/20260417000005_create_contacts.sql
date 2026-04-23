-- T-11: Contact table — email is globally unique across all campaigns
CREATE TABLE public.contacts (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id   uuid        NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  first_name    text        NOT NULL,
  last_name     text,
  company_name  text,
  email         text        NOT NULL,
  phone         text,
  address       text,
  lead_type     text,
  surface_area  text,
  status        text        NOT NULL DEFAULT 'not_contacted'
                            CHECK (status IN ('not_contacted', 'sent', 'opened', 'replied')),
  email_valid   boolean     NOT NULL DEFAULT true,
  meeting_booked boolean    NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email)
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage contacts of their own campaigns"
  ON public.contacts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = contacts.campaign_id
        AND campaigns.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = contacts.campaign_id
        AND campaigns.user_id = auth.uid()
    )
  );
