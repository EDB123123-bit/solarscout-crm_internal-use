-- T-09: Campaign table
CREATE TABLE public.campaigns (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         text        NOT NULL,
  status       text        NOT NULL DEFAULT 'draft'
                           CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  launched_at  timestamptz,
  completed_at timestamptz
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own campaigns"
  ON public.campaigns
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
