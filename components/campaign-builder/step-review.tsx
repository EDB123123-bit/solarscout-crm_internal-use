'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { launchCampaignAction } from '@/app/(dashboard)/campaigns/new/actions'
import type { Campaign, SequenceStep } from '@/types'

type Props = {
  campaign: Campaign
  steps: SequenceStep[]
  contactCount: number
}

const HEADINGS = ['Initiële e-mail', 'Opvolging 1', 'Opvolging 2'] as const

export function StepReview({ campaign, steps, contactCount }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const step0 = steps.find((s) => s.step_index === 0) ?? null
  const canLaunch = contactCount > 0 && step0 !== null

  function onLaunch() {
    startTransition(async () => {
      try {
        const { redirectTo } = await launchCampaignAction(campaign.id)
        toast.success('Campagne gestart — eerste e-mails staan in de wachtrij.')
        router.push(redirectTo)
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Campagne starten mislukt. Probeer opnieuw.'
        )
      }
    })
  }

  const lastConfiguredIndex = Math.max(...steps.map((s) => s.step_index), 0)
  const backUrl = `/campaigns/new?step=template&stepIndex=${lastConfiguredIndex}&campaignId=${campaign.id}`

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Controleer en start</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-md border p-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Campagnenaam</div>
                <div className="mt-1 font-medium">{campaign.name}</div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  router.push(
                    `/campaigns/new?step=name&campaignId=${campaign.id}`
                  )
                }
              >
                Wijzigen
              </Button>
            </div>
          </div>
          <div className="rounded-md border p-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Contacten</div>
                <div className="mt-1 font-medium">{contactCount}</div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  router.push(
                    `/campaigns/new?step=import&campaignId=${campaign.id}`
                  )
                }
              >
                Wijzigen
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {[0, 1, 2].map((i) => {
        const s = steps.find((x) => x.step_index === i)
        return (
          <Card key={i}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>{HEADINGS[i]}</span>
                {s ? (
                  <div className="flex gap-2">
                    {s.step_index !== 0 && (
                      <Badge variant="outline">
                        {s.delay_business_days} werkdagen wachten
                      </Badge>
                    )}
                    {s.step_index !== 0 && (
                      <Badge variant="outline">Geen antwoord</Badge>
                    )}
                    {s.condition_open_required && (
                      <Badge variant="outline">Alleen bij geopend</Badge>
                    )}
                  </div>
                ) : (
                  <Badge variant="secondary">Niet geconfigureerd</Badge>
                )}
              </CardTitle>
            </CardHeader>
            {s && (
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Onderwerp: </span>
                  <span className="font-medium">{s.subject}</span>
                </div>
                <div
                  className="prose prose-sm max-w-none rounded-md border bg-muted/40 p-3"
                  dangerouslySetInnerHTML={{ __html: s.body_html }}
                />
              </CardContent>
            )}
            {!s && i === 0 && (
              <CardContent className="text-sm text-destructive">
                Configureer eerst de initiële e-mail.
              </CardContent>
            )}
          </Card>
        )
      })}

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.push(backUrl)} disabled={pending}>
          Terug
        </Button>
        <Button onClick={onLaunch} disabled={pending || !canLaunch}>
          {pending ? 'Bezig met starten…' : 'Campagne starten'}
        </Button>
      </div>
    </div>
  )
}
