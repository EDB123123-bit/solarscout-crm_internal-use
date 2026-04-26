import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  WizardShell,
  resolveDotIndex,
} from '@/components/campaign-builder/wizard-shell'
import { StepName } from '@/components/campaign-builder/step-name'
import { StepImport } from '@/components/campaign-builder/step-import'
import { StepSequence } from '@/components/campaign-builder/step-sequence'
import { StepTemplate } from '@/components/campaign-builder/step-template'
import { StepReview } from '@/components/campaign-builder/step-review'
import type { Campaign, Contact, SequenceStep } from '@/types'

type SearchParams = Promise<{
  step?: string
  campaignId?: string
  stepIndex?: string
}>

function parseStep(raw: string | undefined): 'name' | 'import' | 'sequence' | 'template' | 'review' {
  if (raw === 'import' || raw === 'sequence' || raw === 'template' || raw === 'review') return raw
  return 'name'
}

export default async function CampaignBuilderPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const step = parseStep(params.step)
  const campaignId = params.campaignId
  const stepIndex = params.stepIndex ? Number(params.stepIndex) : 0

  let campaign: Campaign | null = null
  if (campaignId) {
    const { data } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .maybeSingle()
    if (!data) redirect('/campaigns/new')
    if (data.status !== 'draft') redirect(`/campaigns/${campaignId}`)
    campaign = data as Campaign
  }

  if (step !== 'name' && !campaign) {
    redirect('/campaigns/new')
  }

  const dot = resolveDotIndex(step)

  if (step === 'name') {
    return (
      <WizardShell currentStep={dot}>
        <StepName existingCampaign={campaign} />
      </WizardShell>
    )
  }

  if (step === 'import' && campaign) {
    const { count } = await supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', campaign.id)
    return (
      <WizardShell currentStep={dot}>
        <StepImport campaignId={campaign.id} contactCount={count ?? 0} />
      </WizardShell>
    )
  }

  if (step === 'sequence' && campaign) {
    const [{ data: steps }, { data: firstContactRow }] = await Promise.all([
      supabase
        .from('sequence_steps')
        .select('*')
        .eq('campaign_id', campaign.id)
        .order('step_index', { ascending: true }),
      supabase
        .from('contacts')
        .select('*')
        .eq('campaign_id', campaign.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle(),
    ])
    return (
      <WizardShell currentStep={dot}>
        <StepSequence
          campaignId={campaign.id}
          steps={(steps as SequenceStep[] | null) ?? []}
          firstContact={(firstContactRow as Contact | null) ?? null}
        />
      </WizardShell>
    )
  }

  if (step === 'template' && campaign) {
    const [{ data: existingStep }, { data: firstContactRow }] = await Promise.all([
      supabase
        .from('sequence_steps')
        .select('*')
        .eq('campaign_id', campaign.id)
        .eq('step_index', stepIndex)
        .maybeSingle(),
      supabase
        .from('contacts')
        .select('*')
        .eq('campaign_id', campaign.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle(),
    ])

    return (
      <WizardShell currentStep={dot}>
        <StepTemplate
          campaignId={campaign.id}
          stepIndex={stepIndex}
          existingStep={(existingStep as SequenceStep | null) ?? null}
          firstContact={(firstContactRow as Contact | null) ?? null}
        />
      </WizardShell>
    )
  }

  if (step === 'review' && campaign) {
    const [{ data: steps }, { count }] = await Promise.all([
      supabase
        .from('sequence_steps')
        .select('*')
        .eq('campaign_id', campaign.id)
        .order('step_index', { ascending: true }),
      supabase
        .from('contacts')
        .select('id', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id),
    ])
    return (
      <WizardShell currentStep={dot}>
        <StepReview
          campaign={campaign}
          steps={(steps as SequenceStep[] | null) ?? []}
          contactCount={count ?? 0}
        />
      </WizardShell>
    )
  }

  redirect('/campaigns/new')
}
