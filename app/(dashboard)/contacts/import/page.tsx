import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ImportWizard } from '@/components/contact-import/import-wizard'

type Props = {
  searchParams: Promise<{ campaignId?: string }>
}

export default async function ContactImportPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { campaignId } = await searchParams

  if (!campaignId) {
    return (
      <main className="mx-auto max-w-4xl space-y-4 p-8">
        <h1 className="text-2xl font-semibold">Contacten importeren</h1>
        <Alert variant="destructive">
          <AlertTitle>Geen campagne geselecteerd</AlertTitle>
          <AlertDescription>
            Voeg <code>?campaignId=&lt;uuid&gt;</code> toe aan de URL om een
            import te starten voor een specifieke campagne.
          </AlertDescription>
        </Alert>
      </main>
    )
  }

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id, name')
    .eq('id', campaignId)
    .maybeSingle()

  if (!campaign) {
    return (
      <main className="mx-auto max-w-4xl space-y-4 p-8">
        <h1 className="text-2xl font-semibold">Contacten importeren</h1>
        <Alert variant="destructive">
          <AlertTitle>Campagne niet gevonden</AlertTitle>
          <AlertDescription>
            Deze campagne bestaat niet of je hebt er geen toegang toe.
          </AlertDescription>
        </Alert>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Contacten importeren</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Campagne: {campaign.name}
        </p>
      </div>
      <ImportWizard campaignId={campaign.id} />
    </main>
  )
}
