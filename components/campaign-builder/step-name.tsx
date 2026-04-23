'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  createCampaignAction,
  updateCampaignNameAction,
} from '@/app/(dashboard)/campaigns/new/actions'
import type { Campaign } from '@/types'

type Props = { existingCampaign: Campaign | null }

export function StepName({ existingCampaign }: Props) {
  const router = useRouter()
  const [name, setName] = useState(existingCampaign?.name ?? '')
  const [pending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      try {
        let id: string
        if (existingCampaign) {
          await updateCampaignNameAction(existingCampaign.id, name)
          id = existingCampaign.id
        } else {
          const res = await createCampaignAction(name)
          id = res.id
        }
        router.push(`/campaigns/new?step=import&campaignId=${id}`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Opslaan mislukt.')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Naam je campagne</CardTitle>
        <CardDescription>
          Geef je campagne een naam. Je kunt dit later nog wijzigen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="name">Campagnenaam</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="bv. Q2 prospects Brussel"
              autoFocus
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={pending || name.trim().length < 2}>
              {pending ? 'Opslaan…' : 'Volgende'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
