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

const HOUR_OPTIONS = [6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]

function fmt(h: number) {
  return `${String(h).padStart(2, '0')}:00`
}

export function StepName({ existingCampaign }: Props) {
  const router = useRouter()
  const [name, setName] = useState(existingCampaign?.name ?? '')
  const [startHour, setStartHour] = useState<number>((existingCampaign as any)?.send_hour_start ?? 8)
  const [endHour, setEndHour]     = useState<number>((existingCampaign as any)?.send_hour_end   ?? 18)
  const [pending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (endHour <= startHour) {
      toast.error('Het einduur moet na het beginuur liggen.')
      return
    }
    startTransition(async () => {
      try {
        let id: string
        if (existingCampaign) {
          await updateCampaignNameAction(existingCampaign.id, name, startHour, endHour)
          id = existingCampaign.id
        } else {
          const res = await createCampaignAction(name, startHour, endHour)
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
          Geef je campagne een naam en stel in wanneer e-mails verstuurd mogen worden.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={onSubmit}>
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

          <div className="space-y-2">
            <Label>Verzendvenster (CET)</Label>
            <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 2 }}>
              E-mails worden alleen op weekdagen verstuurd, met een willekeurige spreiding binnen dit venster om spamfilters te vermijden.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
              <select
                value={startHour}
                onChange={e => setStartHour(Number(e.target.value))}
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '6px 10px',
                  fontSize: 14,
                  color: 'var(--foreground)',
                  cursor: 'pointer',
                }}
              >
                {HOUR_OPTIONS.filter(h => h < 20).map(h => (
                  <option key={h} value={h}>{fmt(h)}</option>
                ))}
              </select>
              <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>tot</span>
              <select
                value={endHour}
                onChange={e => setEndHour(Number(e.target.value))}
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '6px 10px',
                  fontSize: 14,
                  color: 'var(--foreground)',
                  cursor: 'pointer',
                }}
              >
                {HOUR_OPTIONS.filter(h => h > 6).map(h => (
                  <option key={h} value={h}>{fmt(h)}</option>
                ))}
              </select>
              <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>CET</span>
            </div>
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
