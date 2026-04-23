export function wrapLinks(htmlBody: string, contactId: string, stepIndex: number): string {
  const base = process.env.NEXT_PUBLIC_APP_URL!
  return htmlBody.replace(
    /(<a\s[^>]*href=")([^"]+)(")/gi,
    (match, prefix, href, suffix) => {
      // Skip mailto, tel, already-tracked links, and anchor-only links
      if (
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('#') ||
        href.includes('/api/track/')
      ) {
        return match
      }
      const tracked = `${base}/api/track/click?cid=${encodeURIComponent(contactId)}&step=${stepIndex}&url=${encodeURIComponent(href)}`
      return `${prefix}${tracked}${suffix}`
    }
  )
}
