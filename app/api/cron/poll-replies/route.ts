import { type NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getValidAccessToken } from '@/lib/token'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim()
}

function base64urlDecode(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  return Buffer.from(base64, 'base64').toString('utf-8')
}

export async function POST(req: NextRequest): Promise<Response> {
  const authHeader = req.headers.get('Authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createServiceClient()

  const { data: mailboxes, error: mailboxErr } = await db
    .from('mailbox_connections')
    .select('id, user_id, provider, email_address, status')
    .eq('status', 'connected')

  if (mailboxErr || !mailboxes?.length) {
    return NextResponse.json({ mailboxes: 0, threadsChecked: 0, repliesFound: 0 })
  }

  let totalThreadsChecked = 0
  let totalRepliesFound = 0

  for (const mailbox of mailboxes) {
    try {
      const { threadsChecked, repliesFound } = await processMailbox(db, mailbox)
      totalThreadsChecked += threadsChecked
      totalRepliesFound += repliesFound
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[poll-replies] Mailbox ${mailbox.id} mislukt: ${msg}`)

      if (msg.includes('401') || msg.includes('invalid_grant') || msg.includes('Token verlopen')) {
        await db
          .from('mailbox_connections')
          .update({ status: 'disconnected' })
          .eq('id', mailbox.id)
      }
    }
  }

  return NextResponse.json({
    mailboxes: mailboxes.length,
    threadsChecked: totalThreadsChecked,
    repliesFound: totalRepliesFound,
  })
}

type DbClient = Awaited<ReturnType<typeof createServiceClient>>

async function processMailbox(
  db: DbClient,
  mailbox: { id: string; user_id: string; provider: string; email_address: string }
): Promise<{ threadsChecked: number; repliesFound: number }> {
  // Fetch distinct thread_ids for this user's active contacts with pending/sent sends
  const { data: threadRows } = await db
    .from('scheduled_sends')
    .select('thread_id, contact_id, contacts!inner(id, email, status, campaign_id, campaigns!inner(user_id))')
    .not('thread_id', 'is', null)
    .eq('status', 'sent')
    .eq('contacts.campaigns.user_id', mailbox.user_id)
    .neq('contacts.status', 'replied')
    .limit(200)
    .order('sent_at', { ascending: false })

  if (!threadRows?.length) return { threadsChecked: 0, repliesFound: 0 }

  // Deduplicate by thread_id, keeping one contact per thread
  const threadMap = new Map<string, { contactId: string; contactEmail: string }>()
  for (const row of threadRows) {
    const r = row as unknown as {
      thread_id: string
      contact_id: string
      contacts: { id: string; email: string; status: string }
    }
    if (r.thread_id && !threadMap.has(r.thread_id)) {
      threadMap.set(r.thread_id, { contactId: r.contact_id, contactEmail: r.contacts.email })
    }
  }

  const accessToken = await getValidAccessToken(mailbox.user_id)
  let repliesFound = 0

  for (const [threadId, { contactId, contactEmail }] of threadMap) {
    try {
      if (mailbox.provider === 'gmail') {
        repliesFound += await checkGmailThread(db, accessToken, threadId, contactId, contactEmail, mailbox.email_address)
      } else {
        repliesFound += await checkOutlookConversation(db, accessToken, threadId, contactId, contactEmail)
      }
    } catch (err) {
      console.error(`[poll-replies] Thread ${threadId} mislukt: ${err instanceof Error ? err.message : err}`)
    }
  }

  return { threadsChecked: threadMap.size, repliesFound }
}

async function checkGmailThread(
  db: DbClient,
  accessToken: string,
  threadId: string,
  contactId: string,
  contactEmail: string,
  mailboxEmail: string
): Promise<number> {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=metadata&metadataHeaders=From&metadataHeaders=Date&metadataHeaders=Message-Id`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!res.ok) return 0

  const thread = await res.json() as {
    messages: Array<{
      id: string
      payload: { headers: Array<{ name: string; value: string }> }
    }>
  }

  let repliesFound = 0

  for (const message of thread.messages ?? []) {
    const headers = message.payload?.headers ?? []
    const from = headers.find(h => h.name === 'From')?.value ?? ''
    const rawMessageId = headers.find(h => h.name === 'Message-Id')?.value ?? message.id

    // Reply = message from contact (not from us)
    if (!from.toLowerCase().includes(contactEmail.toLowerCase())) continue
    if (from.toLowerCase().includes(mailboxEmail.toLowerCase())) continue

    // Check idempotency
    const { data: existing } = await db
      .from('replies')
      .select('id')
      .eq('raw_message_id', rawMessageId)
      .maybeSingle()
    if (existing) continue

    // Fetch full message for body
    const msgRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=full`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (!msgRes.ok) continue

    const fullMsg = await msgRes.json() as {
      payload: {
        mimeType: string
        body: { data?: string }
        parts?: Array<{ mimeType: string; body: { data?: string } }>
      }
    }

    const bodyText = extractGmailBody(fullMsg.payload)
    const receivedAt = new Date().toISOString()

    await persistReply(db, contactId, receivedAt, bodyText, rawMessageId)
    repliesFound++
  }

  return repliesFound
}

function extractGmailBody(payload: {
  mimeType: string
  body: { data?: string }
  parts?: Array<{ mimeType: string; body: { data?: string } }>
}): string {
  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return base64urlDecode(payload.body.data)
  }
  if (payload.parts) {
    const plain = payload.parts.find(p => p.mimeType === 'text/plain')
    if (plain?.body?.data) return base64urlDecode(plain.body.data)
    const html = payload.parts.find(p => p.mimeType === 'text/html')
    if (html?.body?.data) return stripHtml(base64urlDecode(html.body.data))
  }
  if (payload.body?.data) return base64urlDecode(payload.body.data)
  return ''
}

async function checkOutlookConversation(
  db: DbClient,
  accessToken: string,
  conversationId: string,
  contactId: string,
  contactEmail: string
): Promise<number> {
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/me/messages?$filter=conversationId eq '${conversationId}'&$select=id,from,receivedDateTime,bodyPreview,body,internetMessageId&$orderby=receivedDateTime asc&$top=50`,
    { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
  )

  if (!res.ok) return 0

  const data = await res.json() as {
    value: Array<{
      id: string
      from: { emailAddress: { address: string } }
      receivedDateTime: string
      body: { contentType: string; content: string }
      internetMessageId: string
    }>
  }

  let repliesFound = 0

  for (const message of data.value ?? []) {
    const fromEmail = message.from?.emailAddress?.address ?? ''
    if (!fromEmail.toLowerCase().includes(contactEmail.toLowerCase())) continue

    const rawMessageId = message.internetMessageId ?? message.id

    const { data: existing } = await db
      .from('replies')
      .select('id')
      .eq('raw_message_id', rawMessageId)
      .maybeSingle()
    if (existing) continue

    const bodyText = message.body.contentType === 'html'
      ? stripHtml(message.body.content)
      : message.body.content

    await persistReply(db, contactId, message.receivedDateTime, bodyText, rawMessageId)
    repliesFound++
  }

  return repliesFound
}

async function persistReply(
  db: DbClient,
  contactId: string,
  receivedAt: string,
  bodyText: string,
  rawMessageId: string
): Promise<void> {
  // Insert reply (unique index prevents duplicates)
  const { error: insertErr } = await db.from('replies').insert({
    contact_id: contactId,
    received_at: receivedAt,
    body_text: bodyText,
    raw_message_id: rawMessageId,
  })

  // If duplicate (unique constraint violation), skip rest
  if (insertErr) return

  // Update contact status → replied (never clobber — but replied IS the terminal state)
  await db
    .from('contacts')
    .update({ status: 'replied' })
    .eq('id', contactId)
    .neq('status', 'replied')

  // Cancel all pending scheduled_sends for this contact (close the race window)
  await db
    .from('scheduled_sends')
    .update({ status: 'cancelled' })
    .eq('contact_id', contactId)
    .eq('status', 'pending')

  // Remove pending tasks — completed tasks are left intact
  await db
    .from('contact_tasks')
    .delete()
    .eq('contact_id', contactId)
    .is('completed_at', null)

  // Get highest sent step for email_events
  const { data: sentSends } = await db
    .from('scheduled_sends')
    .select('step_index')
    .eq('contact_id', contactId)
    .eq('status', 'sent')
    .order('step_index', { ascending: false })
    .limit(1)

  const stepIndex = sentSends?.[0]?.step_index ?? 0

  await db.from('email_events').insert({
    contact_id: contactId,
    step_index: stepIndex,
    event_type: 'replied',
    timestamp: receivedAt,
    message_id: rawMessageId,
  })
}
