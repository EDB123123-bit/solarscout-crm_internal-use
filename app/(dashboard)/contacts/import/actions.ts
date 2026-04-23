'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { validateEmails, isEmailSyntaxValid } from '@/lib/email-validator'
import type {
  ImportSummary,
  MappedRow,
  RowReason,
  ValidatedRow,
} from '@/lib/contact-import/schema'

async function assertCampaignOwnership(campaignId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Niet aangemeld.')

  const { data: campaign, error } = await supabase
    .from('campaigns')
    .select('id')
    .eq('id', campaignId)
    .maybeSingle()

  if (error) throw new Error('Campagne ophalen mislukt.')
  if (!campaign) throw new Error('Campagne niet gevonden.')
}

function normalizeRow(row: MappedRow): MappedRow {
  const out: MappedRow = { _rowIndex: row._rowIndex }
  for (const [k, v] of Object.entries(row)) {
    if (k === '_rowIndex') continue
    if (typeof v !== 'string') continue
    const trimmed = v.trim()
    if (trimmed.length === 0) continue
    if (k === 'email') {
      out.email = trimmed.toLowerCase()
    } else {
      out[k as keyof MappedRow] = trimmed as never
    }
  }
  return out
}

async function findExistingEmails(emails: string[]): Promise<Set<string>> {
  if (emails.length === 0) return new Set()
  const db = createServiceClient()
  const { data, error } = await db
    .from('contacts')
    .select('email')
    .in('email', emails)
  if (error) throw new Error(`Duplicatencontrole mislukt: ${error.message}`)
  return new Set((data ?? []).map((r) => r.email))
}

export async function validateImportAction(input: {
  campaignId: string
  rows: MappedRow[]
}): Promise<{ validated: ValidatedRow[]; summary: ImportSummary }> {
  await assertCampaignOwnership(input.campaignId)

  const normalized = input.rows.map(normalizeRow)

  const emailsToCheck = new Set<string>()
  for (const r of normalized) {
    if (r.email && isEmailSyntaxValid(r.email)) {
      emailsToCheck.add(r.email)
    }
  }
  const validation = await validateEmails([...emailsToCheck])

  const existingEmails = await findExistingEmails([...emailsToCheck])

  const seenEmails = new Set<string>()
  const validated: ValidatedRow[] = []

  for (const row of normalized) {
    const reasons: RowReason[] = []
    const email = row.email

    if (!row.first_name) reasons.push('missing_first_name')
    if (!email) {
      reasons.push('missing_email')
    } else {
      const v = validation.get(email)
      if (!v) {
        reasons.push('syntax')
      } else if (!v.valid) {
        reasons.push(v.reason === 'syntax' ? 'syntax' : 'mx')
      }
    }

    const hasInvalidReason = reasons.length > 0
    let status: ValidatedRow['status'] = 'valid'

    if (hasInvalidReason) {
      status = 'invalid'
    } else if (email && (existingEmails.has(email) || seenEmails.has(email))) {
      status = 'duplicate'
      reasons.push('duplicate')
    } else if (email) {
      seenEmails.add(email)
    }

    validated.push({ ...row, status, reasons })
  }

  const summary: ImportSummary = {
    total: validated.length,
    invalid: validated.filter((r) => r.status === 'invalid').length,
    duplicates: validated.filter((r) => r.status === 'duplicate').length,
    toImport: validated.filter((r) => r.status === 'valid').length,
  }

  return { validated, summary }
}

export async function commitImportAction(input: {
  campaignId: string
  rows: MappedRow[]
}): Promise<{ inserted: number }> {
  await assertCampaignOwnership(input.campaignId)

  if (input.rows.length === 0) return { inserted: 0 }

  const normalized = input.rows.map(normalizeRow)

  const emailsToCheck = new Set<string>()
  for (const r of normalized) {
    if (r.email && isEmailSyntaxValid(r.email)) emailsToCheck.add(r.email)
  }
  const validation = await validateEmails([...emailsToCheck])
  const existingEmails = await findExistingEmails([...emailsToCheck])

  const seenEmails = new Set<string>()
  const toInsert: {
    campaign_id: string
    first_name: string
    email: string
    last_name: string | null
    company_name: string | null
    phone: string | null
    address: string | null
    lead_type: string | null
    surface_area: string | null
    company_roof_picture: string | null
    general_phone: string | null
    website: string | null
    nace_industry: string | null
    contact_function: string | null
    linkedin_url: string | null
  }[] = []

  for (const row of normalized) {
    if (!row.first_name || !row.email) continue
    const v = validation.get(row.email)
    if (!v || !v.valid) continue
    if (existingEmails.has(row.email) || seenEmails.has(row.email)) continue
    seenEmails.add(row.email)

    toInsert.push({
      campaign_id: input.campaignId,
      first_name: row.first_name,
      email: row.email,
      last_name: row.last_name ?? null,
      company_name: row.company_name ?? null,
      phone: row.phone ?? null,
      address: row.address ?? null,
      lead_type: row.lead_type ?? null,
      surface_area: row.surface_area ?? null,
      company_roof_picture: row.company_roof_picture ?? null,
      general_phone: row.general_phone ?? null,
      website: row.website ?? null,
      nace_industry: row.nace_industry ?? null,
      contact_function: row.contact_function ?? null,
      linkedin_url: row.linkedin_url ?? null,
    })
  }

  if (toInsert.length === 0) return { inserted: 0 }

  const db = createServiceClient()
  const { error, count } = await db
    .from('contacts')
    .insert(toInsert, { count: 'exact' })

  if (error) throw new Error(`Import mislukt: ${error.message}`)

  revalidatePath('/contacts/import')
  return { inserted: count ?? toInsert.length }
}
