'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { nextSendSlot } from '@/lib/campaign-builder/scheduler'
import type { Campaign, StepIndex } from '@/types'

async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Niet aangemeld.')
  return { supabase, user }
}

async function requireDraftCampaign(
  campaignId: string
): Promise<{ campaign: Campaign; supabase: Awaited<ReturnType<typeof createClient>> }> {
  const { supabase } = await requireUser()
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .maybeSingle()
  if (error) throw new Error('Campagne ophalen mislukt.')
  if (!data) throw new Error('Campagne niet gevonden.')
  if (data.status !== 'draft')
    throw new Error('Campagne is al gelanceerd en kan niet meer worden bewerkt.')
  return { campaign: data as Campaign, supabase }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
}

export async function createCampaignAction(
  name: string
): Promise<{ id: string }> {
  const trimmed = name.trim()
  if (trimmed.length < 2) throw new Error('Naam moet minstens 2 tekens bevatten.')

  const { supabase, user } = await requireUser()
  const { data, error } = await supabase
    .from('campaigns')
    .insert({ user_id: user.id, name: trimmed, status: 'draft' })
    .select('id')
    .single()
  if (error || !data) throw new Error(`Campagne aanmaken mislukt: ${error?.message ?? 'onbekend'}`)

  revalidatePath('/campaigns/new')
  return { id: data.id }
}

export async function updateCampaignNameAction(
  id: string,
  name: string
): Promise<void> {
  const trimmed = name.trim()
  if (trimmed.length < 2) throw new Error('Naam moet minstens 2 tekens bevatten.')

  const { supabase } = await requireDraftCampaign(id)
  const { error } = await supabase
    .from('campaigns')
    .update({ name: trimmed })
    .eq('id', id)
  if (error) throw new Error(`Opslaan mislukt: ${error.message}`)

  revalidatePath('/campaigns/new')
}

export async function upsertSequenceStepAction(input: {
  campaignId: string
  stepIndex: StepIndex
  subject: string
  bodyHtml: string
  delayBusinessDays: number
  conditionOpenRequired: boolean
}): Promise<void> {
  const subject = input.subject.trim()
  if (subject.length === 0) throw new Error('Onderwerp mag niet leeg zijn.')
  if (stripHtml(input.bodyHtml).length === 0)
    throw new Error('Bericht mag niet leeg zijn.')
  if (input.stepIndex !== 0) {
    if (
      !Number.isInteger(input.delayBusinessDays) ||
      input.delayBusinessDays < 1 ||
      input.delayBusinessDays > 30
    )
      throw new Error('Wachttijd moet tussen 1 en 30 werkdagen zijn.')
  }

  const { supabase } = await requireDraftCampaign(input.campaignId)

  const { error } = await supabase.from('sequence_steps').upsert(
    {
      campaign_id: input.campaignId,
      step_index: input.stepIndex,
      subject,
      body_html: input.bodyHtml,
      delay_business_days: input.stepIndex === 0 ? 0 : input.delayBusinessDays,
      condition_open_required:
        input.stepIndex === 0 ? false : input.conditionOpenRequired,
    },
    { onConflict: 'campaign_id,step_index' }
  )
  if (error) throw new Error(`Opslaan mislukt: ${error.message}`)

  revalidatePath('/campaigns/new')
}

export async function deleteSequenceStepAction(input: {
  campaignId: string
  stepIndex: 1 | 2
}): Promise<void> {
  const { supabase } = await requireDraftCampaign(input.campaignId)
  const { error } = await supabase
    .from('sequence_steps')
    .delete()
    .eq('campaign_id', input.campaignId)
    .eq('step_index', input.stepIndex)
  if (error) throw new Error(`Verwijderen mislukt: ${error.message}`)

  revalidatePath('/campaigns/new')
}

export async function launchCampaignAction(
  campaignId: string
): Promise<{ redirectTo: string }> {
  const { supabase, campaign } = await requireDraftCampaign(campaignId)

  const { data: step0 } = await supabase
    .from('sequence_steps')
    .select('id')
    .eq('campaign_id', campaignId)
    .eq('step_index', 0)
    .maybeSingle()
  if (!step0) throw new Error('Configureer eerst de initiële e-mail.')

  const { data: contacts, error: contactsError } = await supabase
    .from('contacts')
    .select('id')
    .eq('campaign_id', campaignId)
  if (contactsError) throw new Error(`Contacten ophalen mislukt: ${contactsError.message}`)
  if (!contacts || contacts.length === 0)
    throw new Error('Importeer eerst minstens één contact.')

  const { error: updateError } = await supabase
    .from('campaigns')
    .update({ status: 'active', launched_at: new Date().toISOString() })
    .eq('id', campaign.id)
  if (updateError) throw new Error(`Campagne starten mislukt: ${updateError.message}`)

  const rows = contacts.map((c) => ({
    contact_id: c.id,
    step_index: 0,
    scheduled_at: nextSendSlot().toISOString(),
    status: 'pending',
  }))
  const { error: insertError } = await supabase.from('scheduled_sends').insert(rows)
  if (insertError)
    throw new Error(`Plannen van verzendingen mislukt: ${insertError.message}`)

  revalidatePath('/campaigns/new')
  revalidatePath(`/campaigns/${campaign.id}`)
  return { redirectTo: `/campaigns/${campaign.id}` }
}
