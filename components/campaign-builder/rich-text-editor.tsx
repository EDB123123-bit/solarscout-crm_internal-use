'use client'

import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect, useImperativeHandle, forwardRef } from 'react'
import { Button } from '@/components/ui/button'

export type RichTextEditorHandle = {
  insertText: (text: string) => void
  getHtml: () => string
}

type Props = {
  initialHtml: string
  onChange: (html: string) => void
}

export const RichTextEditor = forwardRef<RichTextEditorHandle, Props>(
  function RichTextEditor({ initialHtml, onChange }, ref) {
    const editor = useEditor({
      extensions: [StarterKit],
      content: initialHtml || '<p></p>',
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class:
            'prose prose-sm max-w-none min-h-[220px] rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring',
        },
      },
      onUpdate: ({ editor }) => {
        onChange(editor.getHTML())
      },
    })

    useImperativeHandle(
      ref,
      () => ({
        insertText: (text: string) => {
          editor?.chain().focus().insertContent(text).run()
        },
        getHtml: () => editor?.getHTML() ?? '',
      }),
      [editor]
    )

    useEffect(() => {
      return () => {
        editor?.destroy()
      }
    }, [editor])

    if (!editor) {
      return (
        <div className="min-h-[220px] rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
          Editor laden…
        </div>
      )
    }

    return (
      <div className="space-y-2">
        <Toolbar editor={editor} />
        <EditorContent editor={editor} />
      </div>
    )
  }
)

function Toolbar({ editor }: { editor: Editor }) {
  const btn = (active: boolean) =>
    active ? 'bg-accent text-accent-foreground' : ''

  return (
    <div className="flex flex-wrap gap-1">
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={btn(editor.isActive('bold'))}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        B
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={btn(editor.isActive('italic')) + ' italic'}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        I
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={btn(editor.isActive('bulletList'))}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        • Lijst
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={btn(editor.isActive('orderedList'))}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1. Lijst
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={btn(editor.isActive('heading', { level: 2 }))}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        Kop
      </Button>
    </div>
  )
}
