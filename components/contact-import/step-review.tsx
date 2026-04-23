'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type {
  ImportSummary,
  RowReason,
  ValidatedRow,
} from '@/lib/contact-import/schema'

type Props = {
  validated: ValidatedRow[]
  summary: ImportSummary
  selectedIndices: Set<number>
  onToggleRow: (rowIndex: number) => void
  onToggleAll: (checked: boolean) => void
  onBack: () => void
  onConfirm: () => void
  submitting: boolean
}

export function StepReview({
  validated,
  summary,
  selectedIndices,
  onToggleRow,
  onToggleAll,
  onBack,
  onConfirm,
  submitting,
}: Props) {
  const visibleRows = validated.filter((r) => r.status !== 'duplicate')
  const selectableRows = visibleRows.filter((r) => r.status === 'valid')
  const selectedCount = selectableRows.filter((r) =>
    selectedIndices.has(r._rowIndex)
  ).length
  const allSelected =
    selectableRows.length > 0 && selectedCount === selectableRows.length

  return (
    <Card>
      <CardHeader>
        <CardTitle>Controleer en bevestig</CardTitle>
        <CardDescription>
          Duplicaten worden automatisch uitgesloten en kunnen niet worden
          geïmporteerd.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <SummaryTiles summary={summary} selectedCount={selectedCount} />

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    disabled={selectableRows.length === 0}
                    onCheckedChange={(v) => onToggleAll(Boolean(v))}
                    aria-label="Selecteer alles"
                  />
                </TableHead>
                <TableHead>Voornaam</TableHead>
                <TableHead>Achternaam</TableHead>
                <TableHead>Bedrijf</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Telefoon</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground"
                  >
                    Geen rijen om te importeren.
                  </TableCell>
                </TableRow>
              )}
              {visibleRows.map((row) => {
                const isValid = row.status === 'valid'
                return (
                  <TableRow key={row._rowIndex}>
                    <TableCell>
                      <Checkbox
                        disabled={!isValid}
                        checked={
                          isValid && selectedIndices.has(row._rowIndex)
                        }
                        onCheckedChange={() => onToggleRow(row._rowIndex)}
                        aria-label={`Selecteer rij ${row._rowIndex + 1}`}
                      />
                    </TableCell>
                    <TableCell>{row.first_name ?? '—'}</TableCell>
                    <TableCell>{row.last_name ?? '—'}</TableCell>
                    <TableCell>{row.company_name ?? '—'}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {row.email ?? '—'}
                    </TableCell>
                    <TableCell>{row.phone ?? '—'}</TableCell>
                    <TableCell>
                      <StatusBadge row={row} />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} disabled={submitting}>
            Terug
          </Button>
          <Button
            onClick={onConfirm}
            disabled={submitting || selectedCount === 0}
          >
            {submitting ? 'Contacten importeren…' : 'Importeren'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function SummaryTiles({
  summary,
  selectedCount,
}: {
  summary: ImportSummary
  selectedCount: number
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Tile label="Totaal" value={summary.total} />
      <Tile label="Ongeldige" value={summary.invalid} tone="destructive" />
      <Tile label="Duplicaten" value={summary.duplicates} tone="muted" />
      <Tile label="Te importeren" value={selectedCount} tone="positive" />
    </div>
  )
}

function Tile({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: number
  tone?: 'default' | 'destructive' | 'muted' | 'positive'
}) {
  const toneClass =
    tone === 'destructive'
      ? 'text-destructive'
      : tone === 'positive'
        ? 'text-emerald-600 dark:text-emerald-400'
        : tone === 'muted'
          ? 'text-muted-foreground'
          : 'text-foreground'
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-2xl font-semibold ${toneClass}`}>{value}</div>
    </div>
  )
}

const REASON_LABEL: Record<RowReason, string> = {
  syntax: 'Ongeldig e-mail',
  mx: 'Ongeldig e-mail',
  missing_first_name: 'Voornaam ontbreekt',
  missing_email: 'E-mail ontbreekt',
  duplicate: 'Duplicaat',
}

function StatusBadge({ row }: { row: ValidatedRow }) {
  if (row.status === 'valid') {
    return <Badge variant="outline">Geldig</Badge>
  }
  const label = row.reasons[0] ? REASON_LABEL[row.reasons[0]] : 'Ongeldig'
  return <Badge variant="destructive">{label}</Badge>
}
