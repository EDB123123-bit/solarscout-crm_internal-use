'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function completeTaskAction(taskId: string, notes?: string): Promise<void> {
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
    .update({ completed_at: new Date().toISOString(), notes: notes?.trim() || null })
    .eq('id', taskId)

  if (error) throw new Error(`Taak voltooien mislukt: ${error.message}`)

  revalidatePath('/taken')
}
