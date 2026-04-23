import {
  EXPECTED_COLUMNS,
  type ColumnMapping,
  type ExpectedColumn,
  type MappedRow,
  type RawRow,
} from './schema'

const ALIASES: Record<ExpectedColumn, string[]> = {
  first_name: [
    'first_name',
    'firstname',
    'first name',
    'fname',
    'voornaam',
    'vn',
  ],
  last_name: [
    'last_name',
    'lastname',
    'last name',
    'lname',
    'achternaam',
    'familienaam',
    'naam',
    'an',
  ],
  company_name: [
    'company_name',
    'companyname',
    'company',
    'company name',
    'bedrijf',
    'bedrijfsnaam',
    'firma',
    'organisatie',
  ],
  email: [
    'email',
    'e-mail',
    'e_mail',
    'emailadres',
    'e-mailadres',
    'mail',
    'mailadres',
  ],
  phone: [
    'phone',
    'phone_number',
    'phonenumber',
    'phone number',
    'telephone',
    'telefoon',
    'telefoonnummer',
    'tel',
    'gsm',
    'mobiel',
  ],
  address: ['address', 'adres', 'straat', 'street', 'location', 'locatie'],
  lead_type: [
    'lead_type',
    'leadtype',
    'lead type',
    'type',
    'soort',
    'soort lead',
  ],
  surface_area: [
    'surface_area',
    'surfacearea',
    'surface area',
    'surface',
    'area',
    'oppervlakte',
    'oppervlak',
    'dakoppervlak',
    'm2',
    'm²',
  ],
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function detectColumns(headers: string[]): ColumnMapping {
  const mapping = {} as ColumnMapping
  const normalizedHeaders = headers.map((h) => ({ raw: h, norm: normalize(h) }))
  const used = new Set<string>()

  for (const col of EXPECTED_COLUMNS) {
    const aliases = ALIASES[col].map(normalize)
    const hit = normalizedHeaders.find(
      (h) => !used.has(h.raw) && aliases.includes(h.norm)
    )
    if (hit) {
      mapping[col] = hit.raw
      used.add(hit.raw)
    } else {
      mapping[col] = null
    }
  }

  return mapping
}

export function isMappingComplete(mapping: ColumnMapping): boolean {
  return EXPECTED_COLUMNS.every((c) => mapping[c] !== null)
}

export function applyMapping(
  rows: RawRow[],
  mapping: ColumnMapping
): MappedRow[] {
  return rows.map((row, idx) => {
    const out: MappedRow = { _rowIndex: idx }
    for (const col of EXPECTED_COLUMNS) {
      const header = mapping[col]
      if (!header) continue
      const raw = row[header]
      if (raw === null || raw === undefined) continue
      const str = String(raw).trim()
      if (str.length === 0) continue
      out[col] = str
    }
    return out
  })
}
