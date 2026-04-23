'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  COLUMN_LABELS,
  EXPECTED_COLUMNS,
  REQUIRED_COLUMNS,
  type ColumnMapping,
  type ExpectedColumn,
} from '@/lib/contact-import/schema'

type Props = {
  headers: string[]
  mapping: ColumnMapping
  onChange: (next: ColumnMapping) => void
  onBack: () => void
  onContinue: () => void
}

const UNMAPPED = '__unmapped__'

export function StepMapping({ headers, mapping, onChange, onBack, onContinue }: Props) {
  const missingRequired = REQUIRED_COLUMNS.filter((c) => !mapping[c])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kolommen toewijzen</CardTitle>
        <CardDescription>
          We konden niet elke kolom automatisch herkennen. Wijs ze zelf toe.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {EXPECTED_COLUMNS.map((col) => (
            <FieldSelect
              key={col}
              column={col}
              headers={headers}
              value={mapping[col]}
              onChange={(v) => onChange({ ...mapping, [col]: v })}
            />
          ))}
        </div>
        {missingRequired.length > 0 && (
          <p className="text-sm text-destructive">
            Verplichte velden ontbreken:{' '}
            {missingRequired.map((c) => COLUMN_LABELS[c]).join(', ')}.
          </p>
        )}
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onBack}>
            Terug
          </Button>
          <Button onClick={onContinue} disabled={missingRequired.length > 0}>
            Doorgaan
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function FieldSelect({
  column,
  headers,
  value,
  onChange,
}: {
  column: ExpectedColumn
  headers: string[]
  value: string | null
  onChange: (v: string | null) => void
}) {
  const isRequired = REQUIRED_COLUMNS.includes(column)
  return (
    <div className="space-y-1.5">
      <Label>
        {COLUMN_LABELS[column]}
        {isRequired && <span className="text-destructive"> *</span>}
      </Label>
      <Select
        value={value ?? UNMAPPED}
        onValueChange={(v) => onChange(v === UNMAPPED ? null : (v as string))}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecteer een kolom" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={UNMAPPED}>— Niet toewijzen —</SelectItem>
          {headers.map((h) => (
            <SelectItem key={h} value={h}>
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
