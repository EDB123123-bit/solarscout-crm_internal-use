export const EXPECTED_COLUMNS = [
  'first_name',
  'last_name',
  'company_name',
  'email',
  'phone',
  'address',
  'lead_type',
  'surface_area',
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
  lead_type: 'Leadtype',
  surface_area: 'Oppervlakte',
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
