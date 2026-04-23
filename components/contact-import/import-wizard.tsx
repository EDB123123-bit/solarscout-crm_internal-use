'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  applyMapping,
  detectColumns,
  isMappingComplete,
} from '@/lib/contact-import/column-detection'
import { parseSpreadsheet } from '@/lib/contact-import/xlsx-parse'
import type {
  ColumnMapping,
  ImportSummary,
  MappedRow,
  RawRow,
  ValidatedRow,
} from '@/lib/contact-import/schema'
import {
  commitImportAction,
  validateImportAction,
} from '@/app/(dashboard)/contacts/import/actions'
import { StepUpload } from './step-upload'
import { StepMapping } from './step-mapping'
import { StepReview } from './step-review'

type Step =
  | 'upload'
  | 'parsing'
  | 'mapping'
  | 'validating'
  | 'review'
  | 'submitting'
  | 'done'
  | 'error'

type Props = { campaignId: string }

export function ImportWizard({ campaignId }: Props) {
  const [step, setStep] = useState<Step>('upload')
  const [headers, setHeaders] = useState<string[]>([])
  const [rawRows, setRawRows] = useState<RawRow[]>([])
  const [mapping, setMapping] = useState<ColumnMapping | null>(null)
  const [validated, setValidated] = useState<ValidatedRow[]>([])
  const [summary, setSummary] = useState<ImportSummary | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [inserted, setInserted] = useState<number>(0)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | undefined>(undefined)

  async function handleFile(file: File) {
    setUploadError(undefined)
    setStep('parsing')
    try {
      const { headers: hdr, rows } = await parseSpreadsheet(file)
      if (hdr.length === 0 || rows.length === 0) {
        setUploadError('Bestand bevat geen rijen.')
        setStep('upload')
        return
      }
      const detected = detectColumns(hdr)
      setHeaders(hdr)
      setRawRows(rows)
      setMapping(detected)

      if (isMappingComplete(detected)) {
        await runValidation(rows, detected)
      } else {
        setStep('mapping')
      }
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'Bestand kon niet gelezen worden.'
      )
      setStep('upload')
    }
  }

  async function runValidation(rows: RawRow[], m: ColumnMapping) {
    setStep('validating')
    try {
      const mapped = applyMapping(rows, m)
      const res = await validateImportAction({ campaignId, rows: mapped })
      setValidated(res.validated)
      setSummary(res.summary)
      const defaultSelection = new Set(
        res.validated
          .filter((r) => r.status === 'valid')
          .map((r) => r._rowIndex)
      )
      setSelected(defaultSelection)
      setStep('review')
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Validatie mislukt.'
      )
      setStep('error')
    }
  }

  function handleMappingContinue() {
    if (!mapping) return
    runValidation(rawRows, mapping)
  }

  function toggleRow(rowIndex: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(rowIndex)) next.delete(rowIndex)
      else next.add(rowIndex)
      return next
    })
  }

  function toggleAll(checked: boolean) {
    if (!checked) {
      setSelected(new Set())
      return
    }
    const all = new Set(
      validated.filter((r) => r.status === 'valid').map((r) => r._rowIndex)
    )
    setSelected(all)
  }

  async function handleConfirm() {
    setStep('submitting')
    try {
      const rows: MappedRow[] = validated
        .filter((r) => r.status === 'valid' && selected.has(r._rowIndex))
        .map((r) => {
          const rest: MappedRow = { _rowIndex: r._rowIndex }
          if (r.first_name) rest.first_name = r.first_name
          if (r.last_name) rest.last_name = r.last_name
          if (r.company_name) rest.company_name = r.company_name
          if (r.email) rest.email = r.email
          if (r.phone) rest.phone = r.phone
          if (r.address) rest.address = r.address
          if (r.lead_type) rest.lead_type = r.lead_type
          if (r.surface_area) rest.surface_area = r.surface_area
          return rest
        })
      const res = await commitImportAction({ campaignId, rows })
      setInserted(res.inserted)
      toast.success('Contacten succesvol geïmporteerd.')
      setStep('done')
    } catch (err) {
      toast.error('Import mislukt. Probeer opnieuw.')
      setErrorMsg(err instanceof Error ? err.message : 'Onbekende fout.')
      setStep('error')
    }
  }

  function reset() {
    setStep('upload')
    setHeaders([])
    setRawRows([])
    setMapping(null)
    setValidated([])
    setSummary(null)
    setSelected(new Set())
    setInserted(0)
    setErrorMsg(null)
    setUploadError(undefined)
  }

  if (step === 'upload') {
    return <StepUpload onFileSelected={handleFile} error={uploadError} />
  }

  if (step === 'parsing') {
    return <LoadingCard text="Bestand inlezen…" />
  }

  if (step === 'mapping' && mapping) {
    return (
      <StepMapping
        headers={headers}
        mapping={mapping}
        onChange={setMapping}
        onBack={reset}
        onContinue={handleMappingContinue}
      />
    )
  }

  if (step === 'validating') {
    return <LoadingCard text="Bezig met valideren…" />
  }

  if ((step === 'review' || step === 'submitting') && summary) {
    return (
      <StepReview
        validated={validated}
        summary={summary}
        selectedIndices={selected}
        onToggleRow={toggleRow}
        onToggleAll={toggleAll}
        onBack={reset}
        onConfirm={handleConfirm}
        submitting={step === 'submitting'}
      />
    )
  }

  if (step === 'done') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Import voltooid</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">{inserted} contacten toegevoegd.</p>
          <Button onClick={reset}>Nieuwe import starten</Button>
        </CardContent>
      </Card>
    )
  }

  if (step === 'error') {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle>Er ging iets mis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMsg && (
            <p className="text-sm text-destructive">{errorMsg}</p>
          )}
          <Button onClick={reset}>Opnieuw proberen</Button>
        </CardContent>
      </Card>
    )
  }

  return null
}

function LoadingCard({ text }: { text: string }) {
  return (
    <Card>
      <CardContent className="py-10 text-center text-sm text-muted-foreground">
        {text}
      </CardContent>
    </Card>
  )
}
