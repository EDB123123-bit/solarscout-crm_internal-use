export function stripHtml(html: string): string {
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

export function buildMime(args: {
  to: string
  from: string
  subject: string
  htmlBody: string
  unsubUrl: string
  threadId?: string
  inReplyTo?: string
  references?: string
}): string {
  const boundary = `boundary_${Math.random().toString(36).slice(2)}`
  const textBody = stripHtml(args.htmlBody)

  const headerLines = [
    `From: ${args.from}`,
    `To: ${args.to}`,
    `Subject: ${args.subject}`,
    `List-Unsubscribe: <${args.unsubUrl}>`,
    'List-Unsubscribe-Post: List-Unsubscribe=One-Click',
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ]

  if (args.inReplyTo) headerLines.push(`In-Reply-To: ${args.inReplyTo}`)
  if (args.references) headerLines.push(`References: ${args.references}`)

  const encodedText = Buffer.from(textBody, 'utf8').toString('base64').match(/.{1,76}/g)!.join('\r\n')
  const encodedHtml = Buffer.from(args.htmlBody, 'utf8').toString('base64').match(/.{1,76}/g)!.join('\r\n')

  const mime = [
    headerLines.join('\r\n'),
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    encodedText,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    encodedHtml,
    '',
    `--${boundary}--`,
  ].join('\r\n')

  return mime
}

export function base64url(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}
