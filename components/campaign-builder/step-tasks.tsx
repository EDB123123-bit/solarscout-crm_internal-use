'use client'

import { useRouter } from 'next/navigation'
import { useTransition, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { addTaskTemplateAction, deleteTaskTemplateAction } from '@/app/(dashboard)/campaigns/new/actions'
import type { TaskTemplate } from '@/types'

type Props = {
  campaignId: string
  templates: TaskTemplate[]
}

const TYPE_LABEL: Record<string, string> = {
  linkedin: 'LinkedIn bericht',
  phone: 'Telefoongesprek',
}

function LinkedInIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
      <path d="M13.6 0H2.4A2.4 2.4 0 0 0 0 2.4v11.2A2.4 2.4 0 0 0 2.4 16h11.2a2.4 2.4 0 0 0 2.4-2.4V2.4A2.4 2.4 0 0 0 13.6 0zM5.2 13.2H2.8V6.4h2.4v6.8zM4 5.36a1.39 1.39 0 1 1 0-2.78 1.39 1.39 0 0 1 0 2.78zM13.2 13.2h-2.4V9.68c0-.9-.02-2.06-1.25-2.06-1.26 0-1.45.98-1.45 2v3.58H5.7V6.4h2.3v.93h.03c.32-.6 1.1-1.24 2.27-1.24 2.43 0 2.88 1.6 2.88 3.68v3.43z"/>
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.3 10.9l-2.1-2.1a1 1 0 0 0-1.4 0l-1.1 1.1a9.5 9.5 0 0 1-3.6-3.6L7.2 5.2a1 1 0 0 0 0-1.4L5.1 1.7A1 1 0 0 0 3.7 1.7L2.3 3.1A3 3 0 0 0 1.5 5c0 5.2 9.2 9.5 9.5 9.5a3 3 0 0 0 1.9-.8l1.4-1.4a1 1 0 0 0 0-1.4z"/>
    </svg>
  )
}

function TaskCard({
  template,
  campaignId,
}: {
  template: TaskTemplate
  campaignId: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [delay, setDelay] = useState(template.delay_business_days)
  const isLinkedIn = template.task_type === 'linkedin'

  function handleDelete() {
    startTransition(async () => {
      await deleteTaskTemplateAction({ campaignId, templateId: template.id })
      router.refresh()
    })
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        borderRadius: 8,
        border: '1px solid var(--border)',
        background: 'var(--card)',
      }}
    >
      <span
        style={{
          color: isLinkedIn ? '#0A66C2' : 'var(--sc-orange, #f97316)',
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        {isLinkedIn ? <LinkedInIcon /> : <PhoneIcon />}
      </span>

      <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>
        {TYPE_LABEL[template.task_type]}
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
        <span className="text-muted-foreground">Na</span>
        <Input
          type="number"
          min={1}
          max={30}
          value={delay}
          onChange={(e) => setDelay(Number(e.target.value))}
          style={{ width: 56, textAlign: 'center', height: 30, padding: '0 6px' }}
          disabled
        />
        <span className="text-muted-foreground">werkdagen</span>
      </div>

      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={handleDelete}
        disabled={isPending}
        style={{ color: 'var(--muted-foreground)', padding: '0 8px' }}
      >
        ✕
      </Button>
    </div>
  )
}

function AddButton({
  taskType,
  campaignId,
  label,
  icon,
}: {
  taskType: 'linkedin' | 'phone'
  campaignId: string
  label: string
  icon: React.ReactNode
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleAdd() {
    startTransition(async () => {
      await addTaskTemplateAction({ campaignId, taskType, delayBusinessDays: taskType === 'linkedin' ? 2 : 3 })
      router.refresh()
    })
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleAdd}
      disabled={isPending}
      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
    >
      {icon}
      {label}
    </Button>
  )
}

export function StepTasks({ campaignId, templates }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Handmatige taken</CardTitle>
        <CardDescription>
          Voeg LinkedIn- of telefoontaken toe voor contacten die over die gegevens beschikken. Taken worden aangemaakt bij het lanceren van de campagne.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">

        {templates.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nog geen taken toegevoegd. Je kan ook overslaan.
          </p>
        )}

        {templates.length > 0 && (
          <div className="space-y-2">
            {templates.map((t) => (
              <TaskCard key={t.id} template={t} campaignId={campaignId} />
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <AddButton
            taskType="linkedin"
            campaignId={campaignId}
            label="LinkedIn stap"
            icon={<LinkedInIcon />}
          />
          <AddButton
            taskType="phone"
            campaignId={campaignId}
            label="Telefoon stap"
            icon={<PhoneIcon />}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              window.location.href = `/campaigns/new?step=template&stepIndex=2&campaignId=${campaignId}`
            }}
          >
            Terug
          </Button>
          <Button
            type="button"
            onClick={() => {
              window.location.href = `/campaigns/new?step=review&campaignId=${campaignId}`
            }}
          >
            {templates.length === 0 ? 'Overslaan' : 'Volgende'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
