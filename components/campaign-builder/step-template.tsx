'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  deleteSequenceStepAction,
  upsertSequenceStepAction,
} from '@/app/(dashboard)/campaigns/new/actions'
import type { Contact, SequenceStep, StepIndex } from '@/types'
import { SequenceConfig } from './sequence-config'
import { TemplateEditor } from './template-editor'

const HEADINGS: Record<StepIndex, string> = {
  0: 'Initiële e-mail',
  1: 'Opvolging 1',
  2: 'Opvolging 2',
}

const DEFAULT_DELAY: Record<StepIndex, number> = { 0: 0, 1: 3, 2: 5 }

type Props = {
  campaignId: string
  stepIndex: StepIndex
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
  const [delay, setDelay] = useState<number>(
    existingStep?.delay_business_days ?? DEFAULT_DELAY[stepIndex]
  )
  const [openRequired, setOpenRequired] = useState<boolean>(
    existingStep?.condition_open_required ?? false
  )
  const [pending, startTransition] = useTransition()

  function nextUrl(): string {
    if (stepIndex === 0)
      return `/campaigns/new?step=template&stepIndex=1&campaignId=${campaignId}`
    if (stepIndex === 1)
      return `/campaigns/new?step=template&stepIndex=2&campaignId=${campaignId}`
    return `/campaigns/new?step=review&campaignId=${campaignId}`
  }

  function backUrl(): string {
    if (stepIndex === 0)
      return `/campaigns/new?step=import&campaignId=${campaignId}`
    if (stepIndex === 1)
      return `/campaigns/new?step=template&stepIndex=0&campaignId=${campaignId}`
    return `/campaigns/new?step=template&stepIndex=1&campaignId=${campaignId}`
  }

  function onNext() {
    startTransition(async () => {
      try {
        await upsertSequenceStepAction({
          campaignId,
          stepIndex,
          subject,
          bodyHtml,
          delayBusinessDays: stepIndex === 0 ? 0 : delay,
          conditionOpenRequired: stepIndex === 0 ? false : openRequired,
        })
        router.push(nextUrl())
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Opslaan mislukt.')
      }
    })
  }

  function onSkip() {
    if (stepIndex === 0) return
    startTransition(async () => {
      try {
        if (existingStep) {
          await deleteSequenceStepAction({
            campaignId,
            stepIndex: stepIndex as 1 | 2,
          })
        }
        // Always jump to review when skipping — FU2 requires FU1, so skipping
        // FU1 means there's nothing to configure further.
        router.push(`/campaigns/new?step=review&campaignId=${campaignId}`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Verwijderen mislukt.')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{HEADINGS[stepIndex]}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {stepIndex !== 0 && (
          <SequenceConfig
            delayBusinessDays={delay}
            onDelayChange={setDelay}
            conditionOpenRequired={openRequired}
            onConditionOpenChange={setOpenRequired}
          />
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
            onClick={() => router.push(backUrl())}
            disabled={pending}
          >
            Terug
          </Button>
          <div className="flex gap-2">
            {stepIndex !== 0 && (
              <Button variant="outline" onClick={onSkip} disabled={pending}>
                Overslaan
              </Button>
            )}
            <Button onClick={onNext} disabled={pending}>
              {pending ? 'Opslaan…' : 'Volgende'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
