'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { pauseCampaign, resumeCampaign } from './actions'

export function PauseResumeButtons({
  campaignId,
  status,
}: {
  campaignId: string
  status: string
}) {
  const [isPending, startTransition] = useTransition()

  if (status === 'active') {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => startTransition(() => pauseCampaign(campaignId))}
      >
        {isPending ? 'Bezig…' : 'Pauzeren'}
      </Button>
    )
  }

  if (status === 'paused') {
    return (
      <Button
        size="sm"
        disabled={isPending}
        onClick={() => startTransition(() => resumeCampaign(campaignId))}
      >
        {isPending ? 'Bezig…' : 'Hervatten'}
      </Button>
    )
  }

  return null
}
