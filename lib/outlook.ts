import { getValidAccessToken } from '@/lib/token'
import { injectPixel } from '@/lib/tracking-pixel'
import { wrapLinks } from '@/lib/tracking-links'
import { buildMime, base64url } from '@/lib/mime'
import { injectUnsubscribeFooter, unsubscribeUrl } from '@/lib/email-footer'

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0/me'

async function graphFetch(
  accessToken: string,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const res = await fetch(`${GRAPH_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })
  return res
}

export async function sendEmail(
  userId: string,
  args: { to: string; fromEmail: string; subject: string; htmlBody: string; contactId: string; stepIndex: number }
): Promise<{ threadId: string; messageId: string }> {
  const accessToken = await getValidAccessToken(userId)
  const unsubUrl = unsubscribeUrl(args.contactId)
  const htmlWithFooter = injectUnsubscribeFooter(args.htmlBody, args.contactId)
  const htmlWithLinks = wrapLinks(htmlWithFooter, args.contactId, args.stepIndex)
  const htmlWithPixel = injectPixel(htmlWithLinks, args.contactId, args.stepIndex)

  const mime = buildMime({
    to: args.to,
    from: args.fromEmail,
    subject: args.subject,
    htmlBody: htmlWithPixel,
    unsubUrl,
  })

  // MIME import path — allows full header control (including List-Unsubscribe)
  const importRes = await fetch(`${GRAPH_BASE}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'text/plain',
    },
    body: base64url(mime),
  })

  if (!importRes.ok) {
    const text = await importRes.text()
    throw new Error(`Graph MIME import mislukt (${importRes.status}): ${text}`)
  }

  const draft = await importRes.json() as { id: string; conversationId: string }

  const sendRes = await graphFetch(accessToken, `/messages/${draft.id}/send`, {
    method: 'POST',
    body: '{}',
  })

  if (!sendRes.ok) {
    const text = await sendRes.text()
    throw new Error(`Graph verzenden mislukt (${sendRes.status}): ${text}`)
  }

  return { threadId: draft.conversationId, messageId: draft.id }
}

export async function sendReply(
  userId: string,
  args: {
    to: string
    fromEmail: string
    subject: string
    htmlBody: string
    conversationId: string
    contactId: string
    stepIndex: number
  }
): Promise<{ threadId: string; messageId: string }> {
  const accessToken = await getValidAccessToken(userId)
  const htmlWithFooter = injectUnsubscribeFooter(args.htmlBody, args.contactId)
  const htmlWithLinks = wrapLinks(htmlWithFooter, args.contactId, args.stepIndex)
  const htmlWithPixel = injectPixel(htmlWithLinks, args.contactId, args.stepIndex)

  // Find the latest message in the conversation to reply to
  const filterRes = await graphFetch(
    accessToken,
    `/messages?$filter=conversationId eq '${args.conversationId}'&$orderby=receivedDateTime desc&$top=1&$select=id`
  )

  if (!filterRes.ok) {
    const text = await filterRes.text()
    throw new Error(`Graph gesprek ophalen mislukt (${filterRes.status}): ${text}`)
  }

  const filterData = await filterRes.json() as { value: { id: string }[] }
  const lastMessageId = filterData.value?.[0]?.id

  if (!lastMessageId) {
    throw new Error(`Geen berichten gevonden in gesprek ${args.conversationId}`)
  }

  const replyDraftRes = await graphFetch(
    accessToken,
    `/messages/${lastMessageId}/createReply`,
    { method: 'POST', body: '{}' }
  )

  if (!replyDraftRes.ok) {
    const text = await replyDraftRes.text()
    throw new Error(`Graph antwoord aanmaken mislukt (${replyDraftRes.status}): ${text}`)
  }

  const replyDraft = await replyDraftRes.json() as { id: string; conversationId: string }

  const patchRes = await graphFetch(accessToken, `/messages/${replyDraft.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      subject: args.subject.startsWith('Re:') ? args.subject : `Re: ${args.subject}`,
      body: { contentType: 'HTML', content: htmlWithPixel },
      toRecipients: [{ emailAddress: { address: args.to } }],
    }),
  })

  if (!patchRes.ok) {
    const text = await patchRes.text()
    throw new Error(`Graph antwoord bewerken mislukt (${patchRes.status}): ${text}`)
  }

  const sendRes = await graphFetch(accessToken, `/messages/${replyDraft.id}/send`, {
    method: 'POST',
    body: '{}',
  })

  if (!sendRes.ok) {
    const text = await sendRes.text()
    throw new Error(`Graph antwoord verzenden mislukt (${sendRes.status}): ${text}`)
  }

  return { threadId: replyDraft.conversationId, messageId: replyDraft.id }
}
