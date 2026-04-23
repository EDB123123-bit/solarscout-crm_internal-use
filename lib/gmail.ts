import { getValidAccessToken } from '@/lib/token'
import { injectPixel } from '@/lib/tracking-pixel'
import { wrapLinks } from '@/lib/tracking-links'
import { buildMime, base64url } from '@/lib/mime'
import { injectUnsubscribeFooter, unsubscribeUrl } from '@/lib/email-footer'

const GMAIL_SEND_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send'

async function gmailSend(
  userId: string,
  mimeRaw: string,
  threadId?: string
): Promise<{ threadId: string; messageId: string }> {
  const accessToken = await getValidAccessToken(userId)

  const body: Record<string, string> = { raw: base64url(mimeRaw) }
  if (threadId) body.threadId = threadId

  const res = await fetch(GMAIL_SEND_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Gmail API fout (${res.status}): ${text}`)
  }

  const data = await res.json() as { id: string; threadId: string }
  return { threadId: data.threadId, messageId: data.id }
}

export async function sendEmail(
  userId: string,
  args: { to: string; fromEmail: string; subject: string; htmlBody: string; contactId: string; stepIndex: number }
): Promise<{ threadId: string; messageId: string }> {
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
  return gmailSend(userId, mime)
}

export async function sendReply(
  userId: string,
  args: {
    to: string
    fromEmail: string
    subject: string
    htmlBody: string
    threadId: string
    contactId: string
    stepIndex: number
  }
): Promise<{ threadId: string; messageId: string }> {
  const unsubUrl = unsubscribeUrl(args.contactId)
  const htmlWithFooter = injectUnsubscribeFooter(args.htmlBody, args.contactId)
  const htmlWithLinks = wrapLinks(htmlWithFooter, args.contactId, args.stepIndex)
  const htmlWithPixel = injectPixel(htmlWithLinks, args.contactId, args.stepIndex)
  const subject = args.subject.startsWith('Re:') ? args.subject : `Re: ${args.subject}`
  const mime = buildMime({
    to: args.to,
    from: args.fromEmail,
    subject,
    htmlBody: htmlWithPixel,
    unsubUrl,
  })
  return gmailSend(userId, mime, args.threadId)
}
