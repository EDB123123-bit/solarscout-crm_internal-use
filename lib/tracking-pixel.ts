export function buildPixelTag(contactId: string, stepIndex: number): string {
  const base = process.env.NEXT_PUBLIC_APP_URL!
  const url = `${base}/api/track/open?cid=${encodeURIComponent(contactId)}&step=${stepIndex}`
  return `<img src="${url}" alt="" width="1" height="1" style="display:block;border:0;" />`
}

export function injectPixel(htmlBody: string, contactId: string, stepIndex: number): string {
  const tag = buildPixelTag(contactId, stepIndex)
  return /<\/body>/i.test(htmlBody)
    ? htmlBody.replace(/<\/body>/i, `${tag}</body>`)
    : `${htmlBody}${tag}`
}
