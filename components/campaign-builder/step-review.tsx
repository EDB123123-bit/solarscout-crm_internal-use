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

function EmailStepIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="14" height="10" rx="2" />
      <path d="M1 5l7 5 7-5" />
    </svg>
  )
}

function LinkedInStepIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={{ color: '#0A66C2' }}>
      <path d="M13.6 0H2.4A2.4 2.4 0 0 0 0 2.4v11.2A2.4 2.4 0 0 0 2.4 16h11.2a2.4 2.4 0 0 0 2.4-2.4V2.4A2.4 2.4 0 0 0 13.6 0zM5.2 13.2H2.8V6.4h2.4v6.8zM4 5.36a1.39 1.39 0 1 1 0-2.78 1.39 1.39 0 0 1 0 2.78zM13.2 13.2h-2.4V9.68c0-.9-.02-2.06-1.25-2.06-1.26 0-1.45.98-1.45 2v3.58H5.7V6.4h2.3v.93h.03c.32-.6 1.1-1.24 2.27-1.24 2.43 0 2.88 1.6 2.88 3.68v3.43z"/>
    </svg>
  )
}

function PhoneStepIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--sc-orange, #f97316)' }}>
      <path d="M14.3 10.9l-2.1-2.1a1 1 0 0 0-1.4 0l-1.1 1.1a9.5 9.5 0 0 1-3.6-3.6L7.2 5.2a1 1 0 0 0 0-1.4L5.1 1.7A1 1 0 0 0 3.7 1.7L2.3 3.1A3 3 0 0 0 1.5 5c0 5.2 9.2 9.5 9.5 9.5a3 3 0 0 0 1.9-.8l1.4-1.4a1 1 0 0 0 0-1.4z"/>
    </svg>
  )
}

function stepTypeLabel(type: string) {
  if (type === 'linkedin') return 'LinkedIn-stap'
  if (type === 'phone') return 'Belstap'
  return 'E-mail'
}

function stepTypeIcon(type: string) {
  if (type === 'linkedin') return <LinkedInStepIcon />
  if (type === 'phone') return <PhoneStepIcon />
  return <EmailStepIcon />
}

export function StepReview({ campaign, steps, contactCount }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const step0 = steps.find((s) => s.step_index === 0 && s.step_type === 'email')
  const canLaunch = contactCount > 0 && !!step0?.subject && !!step0?.body_html

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

  const backUrl = `/campaigns/new?step=sequence&campaignId=${campaign.id}`

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
                onClick={() => router.push(`/campaigns/new?step=name&campaignId=${campaign.id}`)}
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
                onClick={() => router.push(`/campaigns/new?step=import&campaignId=${campaign.id}`)}
              >
                Wijzigen
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {steps.map((s, i) => (
        <Card key={s.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span style={{ display: 'flex', alignItems: 'center' }}>{stepTypeIcon(s.step_type)}</span>
              <span>Stap {i + 1} — {stepTypeLabel(s.step_type)}</span>
              <div className="ml-auto flex gap-2">
                {s.step_index !== 0 && (
                  <Badge variant="outline">{s.delay_business_days} werkdagen wachten</Badge>
                )}
                {s.step_type !== 'email' && (
                  <Badge variant="outline">Alleen bij geen antwoord</Badge>
                )}
                {s.step_type === 'email' && s.condition_open_required && s.step_index !== 0 && (
                  <Badge variant="outline">Alleen bij geopend</Badge>
                )}
                {s.step_type === 'email' && !s.subject && (
                  <Badge variant="secondary">Niet geconfigureerd</Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          {s.step_type === 'email' && s.subject && s.body_html ? (
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
          ) : s.step_type !== 'email' ? (
            <CardContent className="text-sm text-muted-foreground">
              Manuele actie — wordt zichtbaar in Taken voor contacten die niet hebben geantwoord.
            </CardContent>
          ) : (
            <CardContent className="text-sm text-destructive">
              Configureer eerst deze e-mailstap in de reeksbouwer.
            </CardContent>
          )}
        </Card>
      ))}

      {steps.length === 0 && (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            Geen stappen geconfigureerd.
          </CardContent>
        </Card>
      )}

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
