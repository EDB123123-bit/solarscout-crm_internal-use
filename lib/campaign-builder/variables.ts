import type { Contact } from '@/types'

export type RenderVariable = {
  token: string
  label: string
  field: keyof Contact
}

export const RENDER_VARIABLES: RenderVariable[] = [
  { token: '{{first_name}}', label: 'Voornaam', field: 'first_name' },
  { token: '{{company_name}}', label: 'Bedrijfsnaam', field: 'company_name' },
  { token: '{{address}}', label: 'Adres', field: 'address' },
  { token: '{{lead_type}}', label: 'Leadtype', field: 'lead_type' },
  { token: '{{surface_area}}', label: 'Oppervlakte', field: 'surface_area' },
]

export function resolveVariables(
  text: string,
  contact: Partial<Contact> | null | undefined
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const v = RENDER_VARIABLES.find((r) => r.field === key)
    if (!v) return `{{${key}}}`
    const raw = contact?.[v.field]
    if (typeof raw === 'string' && raw.length > 0) return raw
    if (typeof raw === 'number') return String(raw)
    return `[${v.label}]`
  })
}
