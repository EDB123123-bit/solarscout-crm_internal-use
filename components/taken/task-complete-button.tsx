'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { completeTaskAction } from '@/app/(dashboard)/taken/actions'

type Props = { taskId: string }

export function TaskCompleteButton({ taskId }: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleChange() {
    startTransition(async () => {
      await completeTaskAction(taskId)
      router.refresh()
    })
  }

  return (
    <button
      type="button"
      onClick={handleChange}
      disabled={isPending}
      aria-label="Taak voltooien"
      style={{
        width: 20,
        height: 20,
        borderRadius: 4,
        border: '2px solid var(--border)',
        background: 'transparent',
        cursor: isPending ? 'wait' : 'pointer',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'border-color 0.12s',
      }}
      onMouseOver={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--sc-orange, #f97316)'
      }}
      onMouseOut={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'
      }}
    >
      {isPending && (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 6" />
        </svg>
      )}
    </button>
  )
}
