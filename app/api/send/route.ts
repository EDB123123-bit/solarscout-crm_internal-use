import { type NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { nextSendSlot } from '@/lib/campaign-builder/scheduler'
import { resolveVariables } from '@/lib/campaign-builder/variables'
import * as gmail from '@/lib/gmail'
import * as outlook from '@/lib/outlook'

export const runtime = 'nodejs'

export async function POST(req: NextRequest): Promise<Response> {
  const authHeader = req.headers.get('Authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createServiceClient()
  const now = new Date().toISOString()

  // Fetch pending scheduled sends that are due, on active campaigns
  const { data: pendingRows, error: fetchError } = await db
    .from('scheduled_sends')
    .select('id, contact_id, step_index, thread_id')
    .eq('status', 'pending')
    .lte('scheduled_at', now)
    .limit(50)

  if (fetchError) {
    console.error('[/api/send] Ophalen mislukt:', fetchError.message)
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (!pendingRows || pendingRows.length === 0) {
    return NextResponse.json({ processed: 0, sent: 0, failed: 0 })
  }

  let sent = 0
  let failed = 0

  for (const row of pendingRows) {
    try {
      await processRow(db, row)
      sent++
    } catch (err) {
      failed++
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[/api/send] Rij ${row.id} mislukt: ${msg}`)
      await db
        .from('scheduled_sends')
        .update({ status: 'failed' })
        .eq('id', row.id)
    }
  }

  return NextResponse.json({ processed: pendingRows.length, sent, failed })
}

async function processRow(
  db: Awaited<ReturnType<typeof createServiceClient>>,
  row: { id: string; contact_id: string; step_index: number; thread_id: string | null }
): Promise<void> {
  // 1. Load contact + campaign
  const { data: contact, error: contactErr } = await db
    .from('contacts')
    .select('*, campaign:campaigns!inner(id, user_id, status)')
    .eq('id', row.contact_id)
    .maybeSingle()

  if (contactErr || !contact) throw new Error(`Contact niet gevonden: ${contactErr?.message}`)

  // Skip if contact has unsubscribed
  if ((contact as unknown as { unsubscribed_at: string | null }).unsubscribed_at) {
    await db.from('scheduled_sends').update({ status: 'cancelled' }).eq('id', row.id)
    return
  }

  const campaign = (contact as unknown as { campaign: { id: string; user_id: string; status: string } }).campaign

  // Skip if campaign is paused/completed (race condition guard)
  if (campaign.status !== 'active') {
    await db.from('scheduled_sends').update({ status: 'cancelled' }).eq('id', row.id)
    return
  }

  const userId = campaign.user_id

  // 2. Load mailbox connection for provider + fromEmail
  const { data: mailbox, error: mailboxErr } = await db
    .from('mailbox_connections')
    .select('provider, email_address')
    .eq('user_id', userId)
    .maybeSingle()

  if (mailboxErr || !mailbox) throw new Error(`Mailbox niet gevonden: ${mailboxErr?.message}`)

  // 3. Load sequence step for subject + body
  const { data: step, error: stepErr } = await db
    .from('sequence_steps')
    .select('subject, body_html, delay_business_days')
    .eq('campaign_id', campaign.id)
    .eq('step_index', row.step_index)
    .maybeSingle()

  if (stepErr || !step) throw new Error(`Stap niet gevonden voor index ${row.step_index}: ${stepErr?.message}`)
  if (!step.subject || !step.body_html) throw new Error(`Stap ${row.step_index} heeft geen e-mailinhoud.`)

  // 4. Resolve template variables
  const subject = resolveVariables(step.subject, contact)
  const htmlBody = resolveVariables(step.body_html, contact)

  // 5. GUARD: FU1/FU2 requires thread_id from Step 0 (PRD Issue #5)
  let threadId: string | null = null
  if (row.step_index > 0) {
    const { data: step0Send } = await db
      .from('scheduled_sends')
      .select('thread_id')
      .eq('contact_id', row.contact_id)
      .eq('step_index', 0)
      .eq('status', 'sent')
      .maybeSingle()

    if (!step0Send?.thread_id) {
      console.error(`[/api/send] Geen thread_id voor contact ${row.contact_id} stap ${row.step_index} — afgebroken`)
      await db.from('scheduled_sends').update({ status: 'failed' }).eq('id', row.id)
      return
    }
    threadId = step0Send.thread_id
  }

  // 6. Send via correct provider
  const sendArgs = {
    to: contact.email,
    fromEmail: mailbox.email_address,
    subject,
    htmlBody,
    contactId: row.contact_id,
    stepIndex: row.step_index,
  }

  let result: { threadId: string; messageId: string }

  if (mailbox.provider === 'gmail') {
    result = row.step_index === 0
      ? await gmail.sendEmail(userId, sendArgs)
      : await gmail.sendReply(userId, { ...sendArgs, threadId: threadId! })
  } else {
    result = row.step_index === 0
      ? await outlook.sendEmail(userId, sendArgs)
      : await outlook.sendReply(userId, { ...sendArgs, conversationId: threadId! })
  }

  const sentAt = new Date().toISOString()

  // 7. Immediately store thread_id + status (HIGH SEVERITY — PRD Issue #5)
  await db
    .from('scheduled_sends')
    .update({ status: 'sent', sent_at: sentAt, thread_id: result.threadId })
    .eq('id', row.id)

  // 8. Write EmailEvent
  await db.from('email_events').insert({
    contact_id: row.contact_id,
    step_index: row.step_index,
    event_type: 'sent',
    timestamp: sentAt,
    message_id: result.messageId,
  })

  // 9. Update contact status (only if not already opened/replied)
  if (contact.status === 'not_contacted') {
    await db
      .from('contacts')
      .update({ status: 'sent' })
      .eq('id', row.contact_id)
  }

  // 10. Schedule next email follow-up if one exists after the current step
  const { data: nextStep } = await db
    .from('sequence_steps')
    .select('step_index, delay_business_days, condition_open_required')
    .eq('campaign_id', campaign.id)
    .eq('step_type', 'email')
    .gt('step_index', row.step_index)
    .order('step_index', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (nextStep) {
    const scheduledAt = nextSendSlot(new Date(), nextStep.delay_business_days).toISOString()
    await db.from('scheduled_sends').insert({
      contact_id: row.contact_id,
      step_index: nextStep.step_index,
      scheduled_at: scheduledAt,
      status: 'pending',
    })
  }
}
