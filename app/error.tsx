'use client'

import { Card, CardContent } from '@/components/ui/card'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center space-y-4">
          <h1 className="text-xl font-semibold">Er ging iets mis</h1>
          <p className="text-sm text-muted-foreground">
            Er is een onverwachte fout opgetreden. Probeer de pagina opnieuw te laden.
          </p>
          <button
            onClick={() => reset()}
            className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
          >
            Opnieuw proberen
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
