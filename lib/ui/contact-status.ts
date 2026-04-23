import type { BadgeVariant } from '@/components/ui/badge'

export const CONTACT_STATUS_LABEL: Record<string, string> = {
  not_contacted: 'Niet gecontacteerd',
  sent: 'Verzonden',
  opened: 'Geopend',
  replied: 'Beantwoord',
}

export const CONTACT_STATUS_VARIANT: Record<string, BadgeVariant> = {
  not_contacted: 'secondary',
  sent: 'warning',
  opened: 'blue',
  replied: 'success',
}
