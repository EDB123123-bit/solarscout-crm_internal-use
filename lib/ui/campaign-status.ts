import type { BadgeVariant } from '@/components/ui/badge'

export const CAMPAIGN_STATUS_LABEL: Record<string, string> = {
  draft: 'Concept',
  active: 'Actief',
  paused: 'Gepauzeerd',
  completed: 'Voltooid',
}

export const CAMPAIGN_STATUS_VARIANT: Record<string, BadgeVariant> = {
  draft: 'secondary',
  active: 'default',
  paused: 'warning',
  completed: 'success',
}
