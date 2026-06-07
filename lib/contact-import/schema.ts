export const EXPECTED_COLUMNS = [
  'first_name',
  'last_name',
  'company_name',
  'email',
  'phone',
  'address',
  'city',
  'general_phone',
  'website',
  'nace_industry',
  'contact_function',
  'linkedin_url',
] as const

export type ExpectedColumn = (typeof EXPECTED_COLUMNS)[number]

export const REQUIRED_COLUMNS: ExpectedColumn[] = ['first_name', 'email']

export const COLUMN_LABELS: Record<ExpectedColumn, string> = {
  first_name: 'Voornaam',
  last_name: 'Achternaam',
  company_name: 'Bedrijfsnaam',
  email: 'E-mailadres',
  phone: 'Telefoon',
  address: 'Adres',
  city: 'Stad',
  general_phone: 'Algemeen telefoon',
  website: 'Website',
  nace_industry: 'NACE-sector',
  contact_function: 'Functie',
  linkedin_url: 'LinkedIn',
}

export type RawRow = Record<string, string | number | null>

export type MappedRow = Partial<Record<ExpectedColumn, string>> & {
  _rowIndex: number
}

export type RowReason =
  | 'syntax'
  | 'mx'
  | 'missing_first_name'
  | 'missing_email'
  | 'duplicate'

export type ValidatedRow = MappedRow & {
  status: 'valid' | 'invalid' | 'duplicate'
  reasons: RowReason[]
}

export type ImportSummary = {
  total: number
  invalid: number
  duplicates: number
  toImport: number
}

export type ColumnMapping = Record<ExpectedColumn, string | null>
