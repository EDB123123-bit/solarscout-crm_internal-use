import * as XLSX from 'xlsx'
import type { RawRow } from './schema'

export async function parseSpreadsheet(
  file: File
): Promise<{ headers: string[]; rows: RawRow[] }> {
  const buf = await file.arrayBuffer()
  const workbook = XLSX.read(buf, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) return { headers: [], rows: [] }
  const sheet = workbook.Sheets[sheetName]

  const rows = XLSX.utils.sheet_to_json<RawRow>(sheet, {
    defval: null,
    raw: false,
    blankrows: false,
  })

  const headerRows = XLSX.utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    blankrows: false,
  })
  const headers = (headerRows[0] ?? []).map((h) => String(h ?? '').trim())

  return { headers, rows }
}
