import crypto from 'crypto'

function secret(): string {
  const s = process.env.UNSUBSCRIBE_SECRET
  if (!s) throw new Error('UNSUBSCRIBE_SECRET is not set')
  return s
}

export function sign(contactId: string): string {
  const payload = Buffer.from(JSON.stringify({ c: contactId })).toString('base64url')
  const mac = crypto.createHmac('sha256', secret()).update(payload).digest('base64url')
  return `${payload}.${mac}`
}

export function verify(token: string): { contactId: string } | null {
  try {
    const dot = token.lastIndexOf('.')
    if (dot === -1) return null
    const payload = token.slice(0, dot)
    const mac = token.slice(dot + 1)
    const expected = crypto.createHmac('sha256', secret()).update(payload).digest('base64url')
    if (!crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { c: string }
    if (typeof data.c !== 'string') return null
    return { contactId: data.c }
  } catch {
    return null
  }
}
