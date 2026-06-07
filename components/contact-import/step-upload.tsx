'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type Props = {
  onFileSelected: (file: File) => void
  error?: string
}

export function StepUpload({ onFileSelected, error }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contacten importeren</CardTitle>
        <CardDescription>
          Upload een .xlsx- of .csv-bestand met je contacten.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          type="file"
          accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
          className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onFileSelected(file)
          }}
        />
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        <div className="text-xs text-muted-foreground">
          Ondersteunde formaten: eigen spreadsheet of een Apollo.io CSV-export.
          Verplichte velden: voornaam en e-mailadres.
        </div>
      </CardContent>
    </Card>
  )
}
