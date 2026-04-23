'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/empty-state'

export type ReplyRow = {
  id: string
  body_text: string | null
  received_at: string
  raw_message_id: string | null
  contacts: {
    id: string
    first_name: string
    last_name: string | null
    email: string
    company_name: string | null
    campaign_id: string
    campaigns: {
      id: string
      name: string
      user_id: string
    }
  }
}

type ContactGroup = {
  contact: ReplyRow['contacts']
  replies: ReplyRow[]
}

export function RepliesList({ replies }: { replies: ReplyRow[] }) {
  if (replies.length === 0) {
    return (
      <EmptyState
        title="Nog geen antwoorden"
        description="Zodra een prospect antwoordt, verschijnt het hier."
      />
    )
  }

  // Group by contact, preserving insertion order (replies already sorted newest-first)
  const groupMap = new Map<string, ContactGroup>()
  for (const reply of replies) {
    const key = reply.contacts.id
    if (!groupMap.has(key)) {
      groupMap.set(key, { contact: reply.contacts, replies: [] })
    }
    groupMap.get(key)!.replies.push(reply)
  }

  // Sort replies within each group oldest-first so the conversation reads top-to-bottom
  for (const group of groupMap.values()) {
    group.replies.sort((a, b) => new Date(a.received_at).getTime() - new Date(b.received_at).getTime())
  }

  // Groups are already ordered by most-recent-reply-first because the source array is newest-first
  const groups = [...groupMap.values()]

  return (
    <Card>
      <CardContent className="divide-y p-0">
        {groups.map(({ contact, replies: contactReplies }) => {
          const campaign = contact.campaigns
          const latest = contactReplies[contactReplies.length - 1]
          const preview = latest.body_text?.slice(0, 120) ?? ''
          const hasMore = (latest.body_text?.length ?? 0) > 120
          const count = contactReplies.length

          return (
            <details key={contact.id} className="group px-4 py-3">
              <summary className="flex cursor-pointer list-none flex-col gap-1 group-open:mb-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    <Link
                      href={`/campaigns/${campaign.id}/contacts/${contact.id}`}
                      className="hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {contact.first_name} {contact.last_name}
                    </Link>
                    {contact.company_name && (
                      <span className="text-muted-foreground">· {contact.company_name}</span>
                    )}
                    <span className="text-muted-foreground">· {campaign.name}</span>
                    {count > 1 && (
                      <Badge variant="secondary">{count} berichten</Badge>
                    )}
                  </div>
                  <p className="line-clamp-1 text-xs text-muted-foreground">
                    {preview}{hasMore ? '…' : ''}
                  </p>
                </div>
                <time className="shrink-0 text-xs text-muted-foreground">
                  {new Date(latest.received_at).toLocaleString('nl-BE')}
                </time>
              </summary>

              <div className="space-y-3">
                {contactReplies.map((reply, i) => (
                  <div key={reply.id}>
                    {count > 1 && (
                      <div className="mb-1 text-xs text-muted-foreground">
                        Bericht {i + 1} · {new Date(reply.received_at).toLocaleString('nl-BE')}
                      </div>
                    )}
                    {reply.body_text && (
                      <pre className="whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">
                        {reply.body_text}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </details>
          )
        })}
      </CardContent>
    </Card>
  )
}
