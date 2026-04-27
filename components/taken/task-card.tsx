'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { completeTaskAction } from '@/app/(dashboard)/taken/actions'

type TaskCardProps = {
  taskId: string
  taskType: string
  firstName: string
  lastName: string | null
  companyName: string | null
  linkedinUrl: string | null
  phone: string | null
  campaignName: string
  campaignId: string
  contactId: string
  dueLabel: string
  urgent: boolean
  linkedinTemplate: string | null
}

function LinkedInIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ flexShrink: 0, color: '#0A66C2' }}>
      <path d="M13.6 0H2.4A2.4 2.4 0 0 0 0 2.4v11.2A2.4 2.4 0 0 0 2.4 16h11.2a2.4 2.4 0 0 0 2.4-2.4V2.4A2.4 2.4 0 0 0 13.6 0zM5.2 13.2H2.8V6.4h2.4v6.8zM4 5.36a1.39 1.39 0 1 1 0-2.78 1.39 1.39 0 0 1 0 2.78zM13.2 13.2h-2.4V9.68c0-.9-.02-2.06-1.25-2.06-1.26 0-1.45.98-1.45 2v3.58H5.7V6.4h2.3v.93h.03c.32-.6 1.1-1.24 2.27-1.24 2.43 0 2.88 1.6 2.88 3.68v3.43z"/>
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: 'var(--sc-orange, #f97316)' }}>
      <path d="M14.3 10.9l-2.1-2.1a1 1 0 0 0-1.4 0l-1.1 1.1a9.5 9.5 0 0 1-3.6-3.6L7.2 5.2a1 1 0 0 0 0-1.4L5.1 1.7A1 1 0 0 0 3.7 1.7L2.3 3.1A3 3 0 0 0 1.5 5c0 5.2 9.2 9.5 9.5 9.5a3 3 0 0 0 1.9-.8l1.4-1.4a1 1 0 0 0 0-1.4z"/>
    </svg>
  )
}

export function TaskCard({
  taskId, taskType, firstName, lastName, companyName,
  linkedinUrl, phone, campaignName, campaignId, contactId,
  dueLabel, urgent, linkedinTemplate,
}: TaskCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [notes, setNotes] = useState('')
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isLinkedIn = taskType === 'linkedin'

  useEffect(() => {
    if (expanded) textareaRef.current?.focus()
  }, [expanded])

  function copyTemplate() {
    if (!linkedinTemplate) return
    navigator.clipboard.writeText(linkedinTemplate).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleComplete() {
    startTransition(async () => {
      await completeTaskAction(taskId, notes)
      router.refresh()
    })
  }

  return (
    <div style={{
      borderRadius: 10,
      border: expanded ? '1px solid rgba(255,165,0,0.35)' : '1px solid var(--border)',
      background: 'var(--card)',
      transition: 'border-color 0.15s',
      overflow: 'hidden',
    }}>
      {/* Main row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px' }}>

        {/* Afronden button */}
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          disabled={isPending}
          title="Taak afronden"
          style={{
            width: 22,
            height: 22,
            borderRadius: 5,
            border: expanded ? '2px solid var(--sc-orange, #f97316)' : '2px solid var(--border)',
            background: expanded ? 'rgba(255,165,0,0.08)' : 'transparent',
            cursor: isPending ? 'wait' : 'pointer',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'border-color 0.12s, background 0.12s',
          }}
        >
          {expanded && (
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="var(--sc-orange, #f97316)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1.5 5.5l3 3 5-6" />
            </svg>
          )}
        </button>

        {/* Type icon */}
        <span style={{ display: 'flex', alignItems: 'center' }}>
          {isLinkedIn ? <LinkedInIcon /> : <PhoneIcon />}
        </span>

        {/* Contact info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>
            {firstName} {lastName}
            {companyName && (
              <span style={{ fontWeight: 400, color: 'var(--muted-foreground)', marginLeft: 6 }}>
                — {companyName}
              </span>
            )}
          </div>
          <div style={{ marginTop: 3 }}>
            {isLinkedIn && linkedinUrl && (
              <a
                href={linkedinUrl.startsWith('http') ? linkedinUrl : `https://${linkedinUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 12, color: '#0A66C2', textDecoration: 'none' }}
              >
                {linkedinUrl}
              </a>
            )}
            {!isLinkedIn && phone && (
              <a
                href={`tel:${phone.replace(/\s/g, '')}`}
                style={{ fontSize: 12, color: 'var(--sc-orange, #f97316)', textDecoration: 'none' }}
              >
                {phone}
              </a>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 2 }}>
            {campaignName}
          </div>
        </div>

        {/* Bekijk link */}
        <Link
          href={`/campaigns/${campaignId}/contacts/${contactId}`}
          style={{
            fontSize: 12,
            color: 'var(--muted-foreground)',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}
        >
          Bekijk
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 8L8 2M4 2h4v4" />
          </svg>
        </Link>

        {/* Due date badge */}
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: 6,
          whiteSpace: 'nowrap',
          background: urgent ? 'rgba(239,68,68,0.1)' : 'var(--muted)',
          color: urgent ? '#EF4444' : 'var(--muted-foreground)',
        }}>
          {dueLabel}
        </span>
      </div>

      {/* Expand: notes + confirm */}
      {expanded && (
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '12px 16px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}>
          {isLinkedIn && linkedinTemplate && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted-foreground)' }}>
                  Berichttekst
                </span>
                <button
                  type="button"
                  onClick={copyTemplate}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '4px 10px', borderRadius: 5,
                    border: '1px solid var(--border)',
                    background: copied ? 'rgba(34,197,94,0.1)' : 'transparent',
                    fontSize: 12, fontWeight: 500,
                    color: copied ? '#22C55E' : '#0A66C2',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {copied ? (
                    <>
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1.5 6l3 3 6-6" />
                      </svg>
                      Gekopieerd
                    </>
                  ) : (
                    <>
                      <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="4" y="4" width="8" height="9" rx="1.5" />
                        <path d="M2 9.5V2.5A1.5 1.5 0 0 1 3.5 1h6" />
                      </svg>
                      Kopieer
                    </>
                  )}
                </button>
              </div>
              <div style={{
                background: 'rgba(10,102,194,0.06)',
                border: '1px solid rgba(10,102,194,0.2)',
                borderRadius: 6,
                padding: '10px 12px',
                fontSize: 13,
                color: 'var(--foreground)',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
              }}>
                {linkedinTemplate}
              </div>
            </div>
          )}
          <textarea
            ref={textareaRef}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder={isLinkedIn
              ? 'Notitie: bv. connectieverzoek gestuurd, kort bericht meegegeven...'
              : 'Notitie: bv. niet opgenomen, teruggebeld om 14u, geïnteresseerd in demo...'}
            rows={2}
            style={{
              width: '100%',
              resize: 'vertical',
              background: 'var(--muted)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '8px 10px',
              fontSize: 13,
              color: 'var(--foreground)',
              outline: 'none',
              fontFamily: 'inherit',
              lineHeight: 1.5,
            }}
          />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => { setExpanded(false); setNotes('') }}
              disabled={isPending}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'transparent',
                fontSize: 13,
                color: 'var(--muted-foreground)',
                cursor: 'pointer',
              }}
            >
              Annuleren
            </button>
            <button
              type="button"
              onClick={handleComplete}
              disabled={isPending}
              style={{
                padding: '6px 16px',
                borderRadius: 6,
                border: 'none',
                background: '#22C55E',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: isPending ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {isPending ? (
                'Bezig...'
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1.5 6l3 3 6-6" />
                  </svg>
                  Taak afgerond
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
