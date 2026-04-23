-- T-10: SequenceStep table
CREATE TABLE public.sequence_steps (
  id                     uuid     DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id            uuid     NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  step_index             smallint NOT NULL CHECK (step_index IN (0, 1, 2)),
  subject                text     NOT NULL,
  body_html              text     NOT NULL,
  delay_business_days    integer  NOT NULL DEFAULT 0,
  condition_open_required boolean  NOT NULL DEFAULT false,
  UNIQUE (campaign_id, step_index)
);

ALTER TABLE public.sequence_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage steps of their own campaigns"
  ON public.sequence_steps
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = sequence_steps.campaign_id
        AND campaigns.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = sequence_steps.campaign_id
        AND campaigns.user_id = auth.uid()
    )
  );
