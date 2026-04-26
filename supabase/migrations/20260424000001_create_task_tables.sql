-- task_templates: one row per manual-task type configured on a campaign
CREATE TABLE public.task_templates (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id         uuid        NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  task_type           text        NOT NULL CHECK (task_type IN ('linkedin', 'phone')),
  delay_business_days int         NOT NULL DEFAULT 1,
  created_at          timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON public.task_templates
  USING (campaign_id IN (SELECT id FROM public.campaigns WHERE user_id = auth.uid()));

-- contact_tasks: one row per contact per task template (created on campaign launch)
CREATE TABLE public.contact_tasks (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id   uuid        NOT NULL REFERENCES public.contacts(id)  ON DELETE CASCADE,
  campaign_id  uuid        NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  task_type    text        NOT NULL CHECK (task_type IN ('linkedin', 'phone')),
  due_at       timestamptz NOT NULL,
  completed_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.contact_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON public.contact_tasks
  USING (campaign_id IN (SELECT id FROM public.campaigns WHERE user_id = auth.uid()));
