import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  WizardShell,
  resolveDotIndex,
} from '@/components/campaign-builder/wizard-shell'
import { StepName } from '@/components/campaign-builder/step-name'
import { StepImport } from '@/components/campaign-builder/step-import'
import { StepTemplate } from '@/components/campaign-builder/step-template'
import { StepReview } from '@/components/campaign-builder/step-review'
import type { Campaign, Contact, SequenceStep, StepIndex } from '@/types'

type SearchParams = Promise<{
  step?: string
  campaignId?: string
  stepIndex?: string
}>

function parseStep(raw: string | undefined): 'name' | 'import' | 'template' | 'review' {
  if (raw === 'import' || raw === 'template' || raw === 'review') return raw
  return 'name'
}

function parseStepIndex(raw: string | undefined): StepIndex {
  if (raw === '1') return 1
  if (raw === '2') return 2
  return 0
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
  const stepIndex = parseStepIndex(params.stepIndex)

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

  // All non-name steps require a campaign
  if (step !== 'name' && !campaign) {
    redirect('/campaigns/new')
  }

  const dot = resolveDotIndex(step, params.stepIndex)

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

    // Guard: only allow stepIndex 1 if step 0 exists; stepIndex 2 if step 1 exists
    if (stepIndex > 0) {
      const { data: prev } = await supabase
        .from('sequence_steps')
        .select('id')
        .eq('campaign_id', campaign.id)
        .eq('step_index', stepIndex - 1)
        .maybeSingle()
      if (!prev) {
        redirect(
          `/campaigns/new?step=template&stepIndex=${stepIndex - 1}&campaignId=${campaign.id}`
        )
      }
    }

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
