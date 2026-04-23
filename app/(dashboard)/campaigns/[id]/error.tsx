'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'

export default function CampaignDetailError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center space-y-4">
          <h1 className="text-xl font-semibold">Campagne kon niet worden geladen</h1>
          <p className="text-sm text-muted-foreground">
            Er is een fout opgetreden bij het laden van de campagnegegevens.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => reset()}
              className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
            >
              Opnieuw proberen
            </button>
            <Link
              href="/"
              className="inline-flex h-8 items-center rounded-lg border px-3 text-sm font-medium transition-colors hover:bg-muted"
            >
              Terug naar dashboard
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
