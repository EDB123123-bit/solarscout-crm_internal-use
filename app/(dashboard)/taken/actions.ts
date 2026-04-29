'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const MAX_NOTES_LEN = 1000

export async function completeTaskAction(taskId: string, notes?: string): Promise<void> {
  const trimmedNotes = notes?.trim() ?? ''
  if (trimmedNotes.length > MAX_NOTES_LEN)
    throw new Error(`Notitie mag maximaal ${MAX_NOTES_LEN} tekens bevatten.`)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Niet aangemeld.')

  const { data: task } = await supabase
    .from('contact_tasks')
    .select('id, campaigns!inner(user_id)')
    .eq('id', taskId)
    .maybeSingle()

  if (!task) throw new Error('Taak niet gevonden.')

  const { error } = await supabase
    .from('contact_tasks')
    .update({ completed_at: new Date().toISOString(), notes: trimmedNotes || null })
    .eq('id', taskId)

  if (error) throw new Error(`Taak voltooien mislukt: ${error.message}`)

  revalidatePath('/taken')
}
