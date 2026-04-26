'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  addSequenceStepAction,
  deleteSequenceStepAction,
  updateSequenceStepTypeAction,
  updateSequenceStepDelayAction,
} from '@/app/(dashboard)/campaigns/new/actions'
import type { Contact, SequenceStep } from '@/types'

type StepType = 'email' | 'linkedin' | 'phone'

type Props = {
  campaignId: string
  steps: SequenceStep[]
  firstContact: Contact | null
}

function EmailIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="14" height="10" rx="2" />
      <path d="M1 5l7 5 7-5" />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" style={{ color: '#0A66C2' }}>
      <path d="M13.6 0H2.4A2.4 2.4 0 0 0 0 2.4v11.2A2.4 2.4 0 0 0 2.4 16h11.2a2.4 2.4 0 0 0 2.4-2.4V2.4A2.4 2.4 0 0 0 13.6 0zM5.2 13.2H2.8V6.4h2.4v6.8zM4 5.36a1.39 1.39 0 1 1 0-2.78 1.39 1.39 0 0 1 0 2.78zM13.2 13.2h-2.4V9.68c0-.9-.02-2.06-1.25-2.06-1.26 0-1.45.98-1.45 2v3.58H5.7V6.4h2.3v.93h.03c.32-.6 1.1-1.24 2.27-1.24 2.43 0 2.88 1.6 2.88 3.68v3.43z"/>
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--sc-orange, #f97316)' }}>
      <path d="M14.3 10.9l-2.1-2.1a1 1 0 0 0-1.4 0l-1.1 1.1a9.5 9.5 0 0 1-3.6-3.6L7.2 5.2a1 1 0 0 0 0-1.4L5.1 1.7A1 1 0 0 0 3.7 1.7L2.3 3.1A3 3 0 0 0 1.5 5c0 5.2 9.2 9.5 9.5 9.5a3 3 0 0 0 1.9-.8l1.4-1.4a1 1 0 0 0 0-1.4z"/>
    </svg>
  )
}

function typeIcon(type: string) {
  if (type === 'linkedin') return <LinkedInIcon />
  if (type === 'phone') return <PhoneIcon />
  return <EmailIcon />
}

function typeLabel(type: string) {
  if (type === 'linkedin') return 'LinkedIn'
  if (type === 'phone') return 'Bellen'
  return 'E-mail'
}

function isEmailConfigured(step: SequenceStep) {
  return step.step_type === 'email' && !!step.subject && !!step.body_html
}

type StepRowProps = {
  step: SequenceStep
  position: number
  campaignId: string
  onRefresh: () => void
}

function StepRow({ step, position, campaignId, onRefresh }: StepRowProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const isFirst = step.step_index === 0
  const configured = isEmailConfigured(step)

  function changeType(newType: StepType) {
    if (newType === step.step_type) return
    startTransition(async () => {
      try {
        await updateSequenceStepTypeAction({ campaignId, stepId: step.id, stepType: newType })
        onRefresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Type wijzigen mislukt.')
      }
    })
  }

  function changeDelay(value: number) {
    startTransition(async () => {
      try {
        await updateSequenceStepDelayAction({ campaignId, stepId: step.id, delayBusinessDays: value })
        onRefresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Vertraging opslaan mislukt.')
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteSequenceStepAction({ campaignId, stepId: step.id })
        onRefresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Verwijderen mislukt.')
      }
    })
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 16px',
      borderRadius: 8,
      border: '1px solid var(--border)',
      background: 'var(--card)',
      opacity: pending ? 0.6 : 1,
      transition: 'opacity 0.1s',
    }}>
      {/* Position badge */}
      <span style={{
        width: 24, height: 24, borderRadius: '50%',
        background: 'var(--muted)', color: 'var(--muted-foreground)',
        fontSize: 11, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {position}
      </span>

      {/* Type icon */}
      <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        {typeIcon(step.step_type)}
      </span>

      {/* Type selector (locked for first step) */}
      {isFirst ? (
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)', minWidth: 80 }}>
          E-mail
        </span>
      ) : (
        <div style={{ display: 'flex', gap: 2, borderRadius: 6, border: '1px solid var(--border)', overflow: 'hidden', flexShrink: 0 }}>
          {(['email', 'linkedin', 'phone'] as StepType[]).map((t) => (
            <button
              key={t}
              onClick={() => changeType(t)}
              disabled={pending}
              style={{
                padding: '4px 9px',
                fontSize: 12,
                fontWeight: 500,
                background: step.step_type === t ? 'var(--primary)' : 'transparent',
                color: step.step_type === t ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                border: 'none',
                cursor: pending ? 'wait' : 'pointer',
                transition: 'background 0.1s, color 0.1s',
              }}
            >
              {typeLabel(t)}
            </button>
          ))}
        </div>
      )}

      {/* Delay */}
      {isFirst ? (
        <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Dag 1 — direct</span>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted-foreground)' }}>
          <span>Wacht</span>
          <input
            type="number"
            min={1}
            max={30}
            defaultValue={step.delay_business_days}
            disabled={pending}
            onBlur={(e) => {
              const v = parseInt(e.target.value, 10)
              if (!isNaN(v) && v >= 1 && v <= 30 && v !== step.delay_business_days) {
                changeDelay(v)
              }
            }}
            style={{
              width: 48, padding: '3px 6px', borderRadius: 4,
              border: '1px solid var(--border)', background: 'var(--background)',
              color: 'var(--foreground)', fontSize: 13, textAlign: 'center',
            }}
          />
          <span>werkdagen</span>
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* Configure button (email only) */}
      {step.step_type === 'email' && (
        <button
          onClick={() => router.push(`/campaigns/new?step=template&stepIndex=${step.step_index}&campaignId=${campaignId}`)}
          disabled={pending}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 10px', borderRadius: 6,
            border: '1px solid var(--border)', background: 'transparent',
            fontSize: 12, fontWeight: 500,
            color: configured ? '#22c55e' : 'var(--sc-orange, #f97316)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {configured ? (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 6l3 3 5-5" />
              </svg>
              Geconfigureerd
            </>
          ) : (
            <>
              Configureren
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 2l4 4-4 4" />
              </svg>
            </>
          )}
        </button>
      )}

      {/* Delete button (not for first step) */}
      {!isFirst && (
        <button
          onClick={handleDelete}
          disabled={pending}
          aria-label="Stap verwijderen"
          style={{
            width: 28, height: 28, borderRadius: 6,
            border: '1px solid var(--border)', background: 'transparent',
            cursor: pending ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--muted-foreground)',
            flexShrink: 0,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M2 2l10 10M12 2L2 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

export function StepSequence({ campaignId, steps, firstContact }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function refresh() {
    router.refresh()
  }

  function addStep(stepType: StepType) {
    startTransition(async () => {
      try {
        await addSequenceStepAction({ campaignId, stepType, delayBusinessDays: 3 })
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Stap toevoegen mislukt.')
      }
    })
  }

  const step0 = steps.find((s) => s.step_index === 0)
  const canProceed = !!step0 && isEmailConfigured(step0)

  function onNext() {
    if (!canProceed) {
      toast.error('Configureer eerst de initiële e-mail (stap 1).')
      return
    }
    router.push(`/campaigns/new?step=review&campaignId=${campaignId}`)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Campagnereeks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {steps.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nog geen stappen. Voeg een eerste e-mailstap toe om te beginnen.
            </p>
          ) : (
            steps.map((step, i) => (
              <StepRow
                key={step.id}
                step={step}
                position={i + 1}
                campaignId={campaignId}
                onRefresh={refresh}
              />
            ))
          )}

          {/* Add step buttons */}
          <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
            <button
              onClick={() => addStep('email')}
              disabled={pending}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 6,
                border: '1px dashed var(--border)', background: 'transparent',
                fontSize: 12, fontWeight: 500, color: 'var(--muted-foreground)',
                cursor: pending ? 'wait' : 'pointer',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 1v10M1 6h10" />
              </svg>
              E-mailstap
            </button>
            <button
              onClick={() => addStep('linkedin')}
              disabled={pending}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 6,
                border: '1px dashed var(--border)', background: 'transparent',
                fontSize: 12, fontWeight: 500, color: 'var(--muted-foreground)',
                cursor: pending ? 'wait' : 'pointer',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 1v10M1 6h10" />
              </svg>
              LinkedIn-stap
            </button>
            <button
              onClick={() => addStep('phone')}
              disabled={pending}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 6,
                border: '1px dashed var(--border)', background: 'transparent',
                fontSize: 12, fontWeight: 500, color: 'var(--muted-foreground)',
                cursor: pending ? 'wait' : 'pointer',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 1v10M1 6h10" />
              </svg>
              Belstap
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Info block */}
      {steps.length > 0 && (
        <p className="text-xs text-muted-foreground px-1">
          LinkedIn- en belstappen worden pas zichtbaar in &quot;Taken&quot; voor contacten die nog niet hebben geantwoord.
        </p>
      )}

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => router.push(`/campaigns/new?step=import&campaignId=${campaignId}`)}
          disabled={pending}
        >
          Terug
        </Button>
        <Button onClick={onNext} disabled={pending || !canProceed}>
          Volgende
        </Button>
      </div>
    </div>
  )
}
