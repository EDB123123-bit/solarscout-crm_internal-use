'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RENDER_VARIABLES, resolveVariables } from '@/lib/campaign-builder/variables'
import type { Contact } from '@/types'
import {
  RichTextEditor,
  type RichTextEditorHandle,
} from './rich-text-editor'

type Props = {
  subject: string
  bodyHtml: string
  onSubjectChange: (v: string) => void
  onBodyHtmlChange: (v: string) => void
  firstContact: Contact | null
}

type Focused = 'subject' | 'body'

export function TemplateEditor({
  subject,
  bodyHtml,
  onSubjectChange,
  onBodyHtmlChange,
  firstContact,
}: Props) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [focused, setFocused] = useState<Focused>('body')
  const subjectRef = useRef<HTMLInputElement | null>(null)
  const editorRef = useRef<RichTextEditorHandle | null>(null)

  function insertToken(token: string) {
    if (focused === 'subject') {
      const el = subjectRef.current
      if (!el) {
        onSubjectChange(subject + token)
        return
      }
      const start = el.selectionStart ?? subject.length
      const end = el.selectionEnd ?? subject.length
      const next = subject.slice(0, start) + token + subject.slice(end)
      onSubjectChange(next)
      requestAnimationFrame(() => {
        el.focus()
        const pos = start + token.length
        el.setSelectionRange(pos, pos)
      })
    } else {
      editorRef.current?.insertText(token)
    }
  }

  if (mode === 'preview') {
    const resolvedSubject = resolveVariables(subject, firstContact)
    const resolvedBody = resolveVariables(bodyHtml, firstContact)
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Voorbeeld
            {firstContact && (
              <span className="ml-2 normal-case">
                ({firstContact.first_name}
                {firstContact.company_name ? ` — ${firstContact.company_name}` : ''})
              </span>
            )}
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setMode('edit')}
          >
            Bewerken
          </Button>
        </div>
        <div className="rounded-md border p-4">
          <div className="mb-2 text-xs text-muted-foreground">Onderwerp</div>
          <div className="mb-4 font-medium">{resolvedSubject || '—'}</div>
          <div className="mb-2 text-xs text-muted-foreground">Bericht</div>
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: resolvedBody }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Variabelen invoegen
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setMode('preview')}
          disabled={!firstContact}
          title={firstContact ? undefined : 'Importeer eerst een contact om het voorbeeld te bekijken.'}
        >
          Voorbeeld
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {RENDER_VARIABLES.map((v) => (
          <Button
            key={v.token}
            type="button"
            size="sm"
            variant="outline"
            onClick={() => insertToken(v.token)}
          >
            {v.label}
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Onderwerp</Label>
        <Input
          id="subject"
          ref={subjectRef}
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          onFocus={() => setFocused('subject')}
          placeholder="bv. Snelle vraag over jullie dak"
        />
      </div>

      <div className="space-y-2">
        <Label>Bericht</Label>
        <div onFocus={() => setFocused('body')}>
          <RichTextEditor
            ref={editorRef}
            initialHtml={bodyHtml}
            onChange={onBodyHtmlChange}
          />
        </div>
      </div>
    </div>
  )
}
