'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { nextSendSlot } from '@/lib/campaign-builder/scheduler'
import type { Campaign } from '@/types'

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
  stepIndex: number
  stepType: 'email' | 'linkedin' | 'phone'
  subject?: string
  bodyHtml?: string
  delayBusinessDays: number
  conditionOpenRequired: boolean
}): Promise<void> {
  if (input.stepType === 'email') {
    const subject = (input.subject ?? '').trim()
    if (subject.length === 0) throw new Error('Onderwerp mag niet leeg zijn.')
    if (stripHtml(input.bodyHtml ?? '').length === 0)
      throw new Error('Bericht mag niet leeg zijn.')
  }
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
      step_type: input.stepType,
      subject: input.stepType === 'email' ? (input.subject?.trim() ?? null) : null,
      body_html: input.stepType === 'email' ? (input.bodyHtml ?? null) : null,
      delay_business_days: input.stepIndex === 0 ? 0 : input.delayBusinessDays,
      condition_open_required:
        input.stepIndex === 0 ? false : input.conditionOpenRequired,
    },
    { onConflict: 'campaign_id,step_index' }
  )
  if (error) throw new Error(`Opslaan mislukt: ${error.message}`)

  revalidatePath('/campaigns/new')
}

export async function addSequenceStepAction(input: {
  campaignId: string
  stepType: 'email' | 'linkedin' | 'phone'
  delayBusinessDays?: number
}): Promise<void> {
  const { supabase } = await requireDraftCampaign(input.campaignId)

  const { data: existing } = await supabase
    .from('sequence_steps')
    .select('step_index')
    .eq('campaign_id', input.campaignId)
    .order('step_index', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextIndex = existing ? existing.step_index + 1 : 0
  const delay = input.delayBusinessDays ?? 3

  const { error } = await supabase.from('sequence_steps').insert({
    campaign_id: input.campaignId,
    step_index: nextIndex,
    step_type: input.stepType,
    subject: null,
    body_html: null,
    delay_business_days: nextIndex === 0 ? 0 : delay,
    condition_open_required: false,
  })
  if (error) throw new Error(`Stap toevoegen mislukt: ${error.message}`)

  revalidatePath('/campaigns/new')
}

export async function updateSequenceStepTypeAction(input: {
  campaignId: string
  stepId: string
  stepType: 'email' | 'linkedin' | 'phone'
}): Promise<void> {
  const { supabase } = await requireDraftCampaign(input.campaignId)
  const { error } = await supabase
    .from('sequence_steps')
    .update({ step_type: input.stepType })
    .eq('id', input.stepId)
    .eq('campaign_id', input.campaignId)
  if (error) throw new Error(`Type wijzigen mislukt: ${error.message}`)

  revalidatePath('/campaigns/new')
}

export async function updateSequenceStepDelayAction(input: {
  campaignId: string
  stepId: string
  delayBusinessDays: number
}): Promise<void> {
  if (
    !Number.isInteger(input.delayBusinessDays) ||
    input.delayBusinessDays < 1 ||
    input.delayBusinessDays > 30
  )
    throw new Error('Wachttijd moet tussen 1 en 30 werkdagen zijn.')

  const { supabase } = await requireDraftCampaign(input.campaignId)
  const { error } = await supabase
    .from('sequence_steps')
    .update({ delay_business_days: input.delayBusinessDays })
    .eq('id', input.stepId)
    .eq('campaign_id', input.campaignId)
  if (error) throw new Error(`Vertraging opslaan mislukt: ${error.message}`)

  revalidatePath('/campaigns/new')
}

export async function deleteSequenceStepAction(input: {
  campaignId: string
  stepId: string
}): Promise<void> {
  const { supabase } = await requireDraftCampaign(input.campaignId)
  const { error } = await supabase
    .from('sequence_steps')
    .delete()
    .eq('id', input.stepId)
    .eq('campaign_id', input.campaignId)
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
    .eq('step_type', 'email')
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

  // Create contact_tasks from linkedin/phone sequence steps
  const { data: taskSteps } = await supabase
    .from('sequence_steps')
    .select('*')
    .eq('campaign_id', campaignId)
    .in('step_type', ['linkedin', 'phone'])

  if (taskSteps && taskSteps.length > 0) {
    const { data: fullContacts } = await supabase
      .from('contacts')
      .select('id, linkedin_url, phone, general_phone')
      .eq('campaign_id', campaignId)

    const taskRows: { contact_id: string; campaign_id: string; task_type: string; due_at: string }[] = []
    for (const step of taskSteps) {
      for (const c of fullContacts ?? []) {
        if (step.step_type === 'linkedin' && !c.linkedin_url) continue
        if (step.step_type === 'phone' && !c.phone && !c.general_phone) continue
        taskRows.push({
          contact_id: c.id,
          campaign_id: campaignId,
          task_type: step.step_type,
          due_at: nextSendSlot(new Date(), step.delay_business_days).toISOString(),
        })
      }
    }
    if (taskRows.length > 0) {
      await supabase.from('contact_tasks').insert(taskRows)
    }
  }

  revalidatePath('/campaigns/new')
  revalidatePath(`/campaigns/${campaign.id}`)
  return { redirectTo: `/campaigns/${campaign.id}` }
}
