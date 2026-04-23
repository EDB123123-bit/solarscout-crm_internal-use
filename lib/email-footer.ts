import { sign } from '@/lib/unsubscribe-token'

export function unsubscribeUrl(contactId: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? ''
  return `${base}/api/unsubscribe?t=${sign(contactId)}`
}

export function injectUnsubscribeFooter(html: string, contactId: string): string {
  const url = unsubscribeUrl(contactId)
  const footer = `<div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;font-family:sans-serif;text-align:center;">
  <a href="${url}" style="color:#6b7280;text-decoration:underline;">Uitschrijven</a>
</div>`
  return /<\/body>/i.test(html) ? html.replace(/<\/body>/i, `${footer}</body>`) : `${html}${footer}`
}
