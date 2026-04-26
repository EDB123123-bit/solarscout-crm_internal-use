'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  upsertSequenceStepAction,
} from '@/app/(dashboard)/campaigns/new/actions'
import type { Contact, SequenceStep } from '@/types'
import { TemplateEditor } from './template-editor'

type Props = {
  campaignId: string
  stepIndex: number
  existingStep: SequenceStep | null
  firstContact: Contact | null
}

export function StepTemplate({
  campaignId,
  stepIndex,
  existingStep,
  firstContact,
}: Props) {
  const router = useRouter()
  const [subject, setSubject] = useState(existingStep?.subject ?? '')
  const [bodyHtml, setBodyHtml] = useState(existingStep?.body_html ?? '')
  const [openRequired, setOpenRequired] = useState<boolean>(
    existingStep?.condition_open_required ?? false
  )
  const [pending, startTransition] = useTransition()

  const backUrl = `/campaigns/new?step=sequence&campaignId=${campaignId}`

  function onSave() {
    startTransition(async () => {
      try {
        await upsertSequenceStepAction({
          campaignId,
          stepIndex,
          stepType: 'email',
          subject,
          bodyHtml,
          delayBusinessDays: existingStep?.delay_business_days ?? 3,
          conditionOpenRequired: stepIndex === 0 ? false : openRequired,
        })
        router.push(backUrl)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Opslaan mislukt.')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {stepIndex === 0 ? 'Initiële e-mail' : `E-mail configureren — stap ${stepIndex + 1}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {stepIndex !== 0 && (
          <div className="flex items-center gap-3 rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="8" r="7" />
              <path d="M8 5v3M8 11h.01" />
            </svg>
            De vertraging (werkdagen) voor deze stap stel je in op de reekspagina.
            {existingStep?.condition_open_required !== undefined && (
              <label className="ml-auto flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={openRequired}
                  onChange={(e) => setOpenRequired(e.target.checked)}
                  className="accent-primary"
                />
                Alleen als geopend
              </label>
            )}
          </div>
        )}

        <TemplateEditor
          subject={subject}
          bodyHtml={bodyHtml}
          onSubjectChange={setSubject}
          onBodyHtmlChange={setBodyHtml}
          firstContact={firstContact}
        />

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => router.push(backUrl)}
            disabled={pending}
          >
            Terug
          </Button>
          <Button onClick={onSave} disabled={pending}>
            {pending ? 'Opslaan…' : 'Opslaan'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
