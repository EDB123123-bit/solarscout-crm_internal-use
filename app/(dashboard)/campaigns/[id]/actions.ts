'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function getAuthorizedCampaign(campaignId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Niet ingelogd')

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id, user_id, status')
    .eq('id', campaignId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!campaign) throw new Error('Campagne niet gevonden')
  return { supabase, campaign }
}

export async function pauseCampaign(campaignId: string) {
  const { supabase } = await getAuthorizedCampaign(campaignId)
  await supabase
    .from('campaigns')
    .update({ status: 'paused' })
    .eq('id', campaignId)
  revalidatePath(`/campaigns/${campaignId}`)
  revalidatePath('/')
}

export async function resumeCampaign(campaignId: string) {
  const { supabase } = await getAuthorizedCampaign(campaignId)
  await supabase
    .from('campaigns')
    .update({ status: 'active' })
    .eq('id', campaignId)
  revalidatePath(`/campaigns/${campaignId}`)
  revalidatePath('/')
}

export async function deleteCampaign(campaignId: string) {
  const { supabase } = await getAuthorizedCampaign(campaignId)
  const { error } = await supabase.from('campaigns').delete().eq('id', campaignId)
  if (error) throw new Error(error.message)
  redirect('/')
}
