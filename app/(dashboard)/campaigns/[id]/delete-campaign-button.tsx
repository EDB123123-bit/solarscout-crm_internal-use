'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { deleteCampaign } from './actions'

export function DeleteCampaignButton({ campaignId }: { campaignId: string }) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (confirming) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, color: 'var(--sc-faint)' }}>Zeker weten?</span>
        <Button
          size="sm"
          variant="destructive"
          disabled={isPending}
          onClick={() => startTransition(() => deleteCampaign(campaignId))}
        >
          {isPending ? 'Bezig…' : 'Ja, verwijder'}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setConfirming(false)} disabled={isPending}>
          Annuleer
        </Button>
      </div>
    )
  }

  return (
    <Button size="sm" variant="destructive" onClick={() => setConfirming(true)}>
      Verwijder
    </Button>
  )
}
