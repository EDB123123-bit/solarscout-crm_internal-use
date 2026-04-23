'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function markMeetingBooked(contactId: string, campaignId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Niet ingelogd')

  // Verify ownership
  const { data: contact } = await supabase
    .from('contacts')
    .select('id, meeting_booked, campaign_id, campaigns!inner(user_id)')
    .eq('id', contactId)
    .maybeSingle()

  if (!contact) throw new Error('Contact niet gevonden')

  const c = contact as unknown as { id: string; meeting_booked: boolean; campaigns: { user_id: string } }
  if (c.campaigns.user_id !== user.id) throw new Error('Geen toegang')
  if (c.meeting_booked) return // idempotent

  await supabase
    .from('contacts')
    .update({ meeting_booked: true, meeting_booked_at: new Date().toISOString() })
    .eq('id', contactId)

  revalidatePath(`/campaigns/${campaignId}/contacts/${contactId}`)
  revalidatePath(`/campaigns/${campaignId}`)
  revalidatePath('/')
}
