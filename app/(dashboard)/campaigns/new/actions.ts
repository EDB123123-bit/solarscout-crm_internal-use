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

const MAX_LINKEDIN_TEMPLATE_LEN = 2000
const MAX_BODY_HTML_LEN = 50_000
const MAX_SUBJECT_LEN = 200
const MAX_NAME_LEN = 120

function validateSendWindow(startHour: number, endHour: number): void {
  if (!Number.isInteger(startHour) || !Number.isInteger(endHour))
    throw new Error('Verzendvenster moet uit gehele uren bestaan.')
  if (startHour < 6 || startHour > 20 || endHour < 6 || endHour > 20)
    throw new Error('Verzendvenster moet tussen 6:00 en 20:00 vallen.')
  if (endHour <= startHour)
    throw new Error('Eindtijd moet na starttijd liggen.')
}

export async function createCampaignAction(
  name: string,
  sendHourStart: number = 8,
  sendHourEnd: number = 18,
): Promise<{ id: string }> {
  const trimmed = name.trim()
  if (trimmed.length < 2) throw new Error('Naam moet minstens 2 tekens bevatten.')
  if (trimmed.length > MAX_NAME_LEN) throw new Error(`Naam mag maximaal ${MAX_NAME_LEN} tekens bevatten.`)
  validateSendWindow(sendHourStart, sendHourEnd)

  const { supabase, user } = await requireUser()
  const { data, error } = await supabase
    .from('campaigns')
    .insert({ user_id: user.id, name: trimmed, status: 'draft', send_hour_start: sendHourStart, send_hour_end: sendHourEnd })
    .select('id')
    .single()
  if (error || !data) throw new Error(`Campagne aanmaken mislukt: ${error?.message ?? 'onbekend'}`)

  revalidatePath('/campaigns/new')
  return { id: data.id }
}

export async function updateCampaignNameAction(
  id: string,
  name: string,
  sendHourStart: number = 8,
  sendHourEnd: number = 18,
): Promise<void> {
  const trimmed = name.trim()
  if (trimmed.length < 2) throw new Error('Naam moet minstens 2 tekens bevatten.')
  if (trimmed.length > MAX_NAME_LEN) throw new Error(`Naam mag maximaal ${MAX_NAME_LEN} tekens bevatten.`)
  validateSendWindow(sendHourStart, sendHourEnd)

  const { supabase } = await requireDraftCampaign(id)
  const { error } = await supabase
    .from('campaigns')
    .update({ name: trimmed, send_hour_start: sendHourStart, send_hour_end: sendHourEnd })
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
    if (subject.length > MAX_SUBJECT_LEN) throw new Error(`Onderwerp mag maximaal ${MAX_SUBJECT_LEN} tekens bevatten.`)
    if (stripHtml(input.bodyHtml ?? '').length === 0)
      throw new Error('Bericht mag niet leeg zijn.')
    if ((input.bodyHtml ?? '').length > MAX_BODY_HTML_LEN)
      throw new Error('Bericht is te lang.')
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

export async function updateLinkedInTemplateAction(input: {
  campaignId: string
  stepId: string
  template: string
}): Promise<void> {
  const trimmed = input.template.trim()
  if (trimmed.length > MAX_LINKEDIN_TEMPLATE_LEN)
    throw new Error(`Berichttekst mag maximaal ${MAX_LINKEDIN_TEMPLATE_LEN} tekens bevatten.`)

  const { supabase } = await requireDraftCampaign(input.campaignId)
  const { error } = await supabase
    .from('sequence_steps')
    .update({ linkedin_message_template: trimmed || null })
    .eq('id', input.stepId)
    .eq('campaign_id', input.campaignId)
  if (error) throw new Error(`Berichttekst opslaan mislukt: ${error.message}`)

  revalidatePath('/campaigns/new')
}

export async function updateCallScriptAction(input: {
  campaignId: string
  stepId: string
  template: string
}): Promise<void> {
  const trimmed = input.template.trim()
  if (trimmed.length > MAX_LINKEDIN_TEMPLATE_LEN)
    throw new Error(`Belscript mag maximaal ${MAX_LINKEDIN_TEMPLATE_LEN} tekens bevatten.`)

  const { supabase } = await requireDraftCampaign(input.campaignId)
  const { error } = await supabase
    .from('sequence_steps')
    .update({ call_script_template: trimmed || null })
    .eq('id', input.stepId)
    .eq('campaign_id', input.campaignId)
  if (error) throw new Error(`Belscript opslaan mislukt: ${error.message}`)

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

  const startHour = (campaign as any).send_hour_start ?? 8
  const endHour   = (campaign as any).send_hour_end   ?? 18

  const rows = contacts.map((c) => ({
    contact_id: c.id,
    step_index: 0,
    scheduled_at: nextSendSlot(new Date(), 0, startHour, endHour).toISOString(),
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
          due_at: nextSendSlot(new Date(), step.delay_business_days, startHour, endHour).toISOString(),
        })
      }
    }
    if (taskRows.length > 0) {
      const { error: taskError } = await supabase.from('contact_tasks').insert(taskRows)
      if (taskError) {
        await supabase.from('scheduled_sends')
          .delete()
          .in('contact_id', contacts.map((c) => c.id))
          .is('sent_at', null)
        throw new Error(`Taken aanmaken mislukt: ${taskError.message}`)
      }
    }
  }

  // Flip status last so partial failures above leave the campaign as draft and replayable.
  const { error: updateError } = await supabase
    .from('campaigns')
    .update({ status: 'active', launched_at: new Date().toISOString() })
    .eq('id', campaign.id)
  if (updateError) throw new Error(`Campagne starten mislukt: ${updateError.message}`)

  revalidatePath('/campaigns/new')
  revalidatePath(`/campaigns/${campaign.id}`)
  return { redirectTo: `/campaigns/${campaign.id}` }
}
