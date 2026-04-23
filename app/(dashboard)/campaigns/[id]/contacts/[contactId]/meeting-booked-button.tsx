'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { markMeetingBooked } from './actions'

export function MeetingBookedButton({
  contactId,
  campaignId,
  alreadyBooked,
  disabled = false,
}: {
  contactId: string
  campaignId: string
  alreadyBooked: boolean
  disabled?: boolean
}) {
  const [isPending, startTransition] = useTransition()

  if (alreadyBooked) {
    return (
      <Button variant="outline" size="sm" disabled>
        Vergadering gepland ✓
      </Button>
    )
  }

  return (
    <Button
      size="sm"
      disabled={isPending || disabled}
      onClick={() => startTransition(() => markMeetingBooked(contactId, campaignId))}
    >
      {isPending ? 'Bezig…' : 'Markeer als vergadering gepland'}
    </Button>
  )
}
