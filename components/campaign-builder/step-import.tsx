'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ImportWizard } from '@/components/contact-import/import-wizard'

type Props = { campaignId: string; contactCount: number }

export function StepImport({ campaignId, contactCount }: Props) {
  const router = useRouter()
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Contacten importeren</CardTitle>
          <CardDescription>
            Upload je contactlijst. Je kunt pas doorgaan zodra er minstens één
            contact is geïmporteerd.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm">
            <span className="font-medium">{contactCount}</span>{' '}
            <span className="text-muted-foreground">contacten geïmporteerd</span>
          </div>
        </CardContent>
      </Card>

      <ImportWizard campaignId={campaignId} />

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() =>
            router.push(`/campaigns/new?step=name&campaignId=${campaignId}`)
          }
        >
          Terug
        </Button>
        <Button
          disabled={contactCount === 0}
          onClick={() =>
            router.push(
              `/campaigns/new?step=template&stepIndex=0&campaignId=${campaignId}`
            )
          }
        >
          Volgende
        </Button>
      </div>
    </div>
  )
}
