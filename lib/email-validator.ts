import { promises as dns } from 'node:dns'

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/

export function isEmailSyntaxValid(email: string): boolean {
  if (!email || email.length > 254) return false
  return EMAIL_REGEX.test(email)
}

const MX_TIMEOUT_MS = 4000

export async function hasMxRecord(domain: string): Promise<boolean> {
  try {
    const records = await Promise.race([
      dns.resolveMx(domain),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('mx_timeout')), MX_TIMEOUT_MS)
      ),
    ])
    return Array.isArray(records) && records.length > 0
  } catch {
    return false
  }
}

export type EmailValidation = { valid: boolean; reason?: 'syntax' | 'mx' }

export async function validateEmails(
  emails: string[],
  opts: { concurrency?: number } = {}
): Promise<Map<string, EmailValidation>> {
  const concurrency = opts.concurrency ?? 10
  const result = new Map<string, EmailValidation>()

  const normalized = new Set<string>()
  for (const raw of emails) {
    normalized.add(raw.trim().toLowerCase())
  }

  const domains = new Set<string>()
  for (const email of normalized) {
    if (!isEmailSyntaxValid(email)) {
      result.set(email, { valid: false, reason: 'syntax' })
      continue
    }
    const domain = email.split('@')[1]
    if (domain) domains.add(domain)
  }

  const domainList = [...domains]
  const mxByDomain = new Map<string, boolean>()
  for (let i = 0; i < domainList.length; i += concurrency) {
    const batch = domainList.slice(i, i + concurrency)
    const outcomes = await Promise.all(batch.map((d) => hasMxRecord(d)))
    batch.forEach((d, idx) => mxByDomain.set(d, outcomes[idx]))
  }

  for (const email of normalized) {
    if (result.has(email)) continue
    const domain = email.split('@')[1]
    const mxOk = domain ? (mxByDomain.get(domain) ?? false) : false
    result.set(email, mxOk ? { valid: true } : { valid: false, reason: 'mx' })
  }

  return result
}
