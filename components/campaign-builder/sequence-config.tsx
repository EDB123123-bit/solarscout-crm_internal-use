'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Props = {
  delayBusinessDays: number
  onDelayChange: (n: number) => void
  conditionOpenRequired: boolean
  onConditionOpenChange: (v: boolean) => void
}

export function SequenceConfig({
  delayBusinessDays,
  onDelayChange,
  conditionOpenRequired,
  onConditionOpenChange,
}: Props) {
  return (
    <div className="space-y-4 rounded-md border p-4">
      <div className="space-y-2">
        <Label htmlFor="delay">Wachttijd (werkdagen)</Label>
        <Input
          id="delay"
          type="number"
          min={1}
          max={30}
          value={delayBusinessDays}
          onChange={(e) => {
            const n = Number(e.target.value)
            if (Number.isFinite(n)) onDelayChange(Math.max(1, Math.min(30, Math.round(n))))
          }}
          className="max-w-[120px]"
        />
      </div>

      <div className="space-y-3">
        <label className="flex items-start gap-3 text-sm">
          <Checkbox checked disabled aria-label="niet-geantwoord-verplicht" />
          <span className="text-muted-foreground">
            Alleen verzenden als contact niet heeft geantwoord
          </span>
        </label>

        <label className="flex items-start gap-3 text-sm">
          <Checkbox
            checked={conditionOpenRequired}
            onCheckedChange={(v) => onConditionOpenChange(Boolean(v))}
            aria-label="alleen-bij-geopend"
          />
          <span>Alleen verzenden als vorige e-mail is geopend</span>
        </label>

        {conditionOpenRequired && (
          <Alert>
            <AlertDescription>
              Openingsdetectie kan onnauwkeurig zijn vanwege privacyinstellingen
              van e-mailclients.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
