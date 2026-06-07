import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { OpenTrackingNotice } from '@/components/open-tracking-notice'
import { MeetingBookedButton } from './meeting-booked-button'
import { CONTACT_STATUS_LABEL, CONTACT_STATUS_VARIANT } from '@/lib/ui/contact-status'
import type { Contact, EmailEvent, Reply, SequenceStep } from '@/types'

type Params = Promise<{ id: string; contactId: string }>

type ContactWithCampaign = Contact & {
  campaigns: { id: string; user_id: string; name: string }
}

export default async function LeadDetailPage({ params }: { params: Params }) {
  const { id: campaignId, contactId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: contactRaw },
    { data: eventsRaw },
    { data: repliesRaw },
    { data: stepsRaw },
    { data: completedTasksRaw },
  ] = await Promise.all([
    supabase
      .from('contacts')
      .select('*, campaigns!inner(id, user_id, name)')
      .eq('id', contactId)
      .eq('campaign_id', campaignId)
      .maybeSingle(),
    supabase
      .from('email_events')
      .select('*')
      .eq('contact_id', contactId)
      .order('timestamp', { ascending: true }),
    supabase
      .from('replies')
      .select('*')
      .eq('contact_id', contactId)
      .order('received_at', { ascending: true }),
    supabase
      .from('sequence_steps')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('step_index', { ascending: true }),
    supabase
      .from('contact_tasks')
      .select('id, task_type, completed_at, notes')
      .eq('contact_id', contactId)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: true }),
  ])

  if (!contactRaw) redirect(`/campaigns/${campaignId}`)
  const contact = contactRaw as ContactWithCampaign
  if (contact.campaigns.user_id !== user.id) redirect('/')

  const events = (eventsRaw ?? []) as EmailEvent[]
  const replies = (repliesRaw ?? []) as Reply[]
  const steps = (stepsRaw ?? []) as SequenceStep[]
  const subjectByStep = Object.fromEntries(steps.map(s => [s.step_index, s.subject]))

  // Build unified timeline
  type TimelineItem =
    | { kind: 'sent'; stepIndex: number; timestamp: string }
    | { kind: 'opened'; stepIndex: number; timestamp: string }
    | { kind: 'clicked'; stepIndex: number; url: string | null; timestamp: string }
    | { kind: 'replied'; body: string | null; timestamp: string }
    | { kind: 'meeting'; timestamp: string }
    | { kind: 'task_done'; taskType: string; notes: string | null; timestamp: string }

  const timeline: TimelineItem[] = []

  for (const ev of events) {
    if (ev.event_type === 'sent') {
      timeline.push({ kind: 'sent', stepIndex: ev.step_index, timestamp: ev.timestamp })
    } else if (ev.event_type === 'opened') {
      timeline.push({ kind: 'opened', stepIndex: ev.step_index, timestamp: ev.timestamp })
    } else if (ev.event_type === 'clicked') {
      timeline.push({ kind: 'clicked', stepIndex: ev.step_index, url: (ev as EmailEvent & { url?: string | null }).url ?? null, timestamp: ev.timestamp })
    }
  }

  for (const reply of replies) {
    timeline.push({ kind: 'replied', body: reply.body_text, timestamp: reply.received_at })
  }

  if (contact.meeting_booked && contact.meeting_booked_at) {
    timeline.push({ kind: 'meeting', timestamp: contact.meeting_booked_at })
  }

  for (const t of (completedTasksRaw ?? [])) {
    timeline.push({ kind: 'task_done', taskType: t.task_type, notes: t.notes ?? null, timestamp: t.completed_at })
  }

  timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  return (
    <div style={{ height: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* Topbar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 5,
        background: 'var(--topbar-bg)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)', padding: '0 32px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href={`/campaigns/${campaignId}`} style={{ color: 'var(--sc-faint)', fontSize: 13, textDecoration: 'none' }}>
            Campagne
          </Link>
          <span style={{ color: 'var(--sc-faint)', fontSize: 13 }}>/</span>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.4px' }}>
            {contact.first_name} {contact.last_name}
          </div>
          {contact.company_name && (
            <span style={{ fontSize: 13, color: 'var(--sc-faint)' }}>{contact.company_name}</span>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-6 p-8" style={{ width: '100%' }}>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Contact info */}
        <Card>
          <CardHeader>
            <CardTitle>Contactgegevens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">

            {/* Bedrijf */}
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bedrijf</div>
              <InfoRow label="Naam" value={contact.company_name} />
              <InfoRow label="Adres" value={contact.address} />
              <InfoRow label="Stad" value={contact.city} />
              <InfoRow label="Telefoon" value={contact.general_phone} />
              <LinkRow label="Website" href={contact.website} display={contact.website} />
              <InfoRow label="NACE-sector" value={contact.nace_industry} />
            </div>

            <hr style={{ borderColor: 'var(--border)' }} />

            {/* Contactpersoon */}
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contactpersoon</div>
              <InfoRow label="Functie" value={contact.contact_function} />
              <InfoRow label="E-mail" value={contact.email} />
              <InfoRow label="Telefoon" value={contact.phone} />
              <LinkRow label="LinkedIn" href={contact.linkedin_url} display="LinkedIn profiel" />
            </div>

            <hr style={{ borderColor: 'var(--border)' }} />

            {/* Status */}
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</div>
              <div className="flex items-center gap-2 pt-1">
                <span className="w-28 shrink-0 text-muted-foreground">Status</span>
                <Badge variant={CONTACT_STATUS_VARIANT[contact.status] ?? 'outline'}>
                  {CONTACT_STATUS_LABEL[contact.status] ?? contact.status}
                </Badge>
              </div>
              {contact.unsubscribed_at && (
                <div
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-xs"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#FCA5A5' }}
                >
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                    <circle cx="8" cy="8" r="7" stroke="#EF4444" strokeWidth="1.5" />
                    <line x1="8" y1="5" x2="8" y2="8.5" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="8" cy="11" r="0.75" fill="#EF4444" />
                  </svg>
                  Uitgeschreven op {new Date(contact.unsubscribed_at).toLocaleDateString('nl-BE')}
                </div>
              )}
            </div>

            <div className="pt-1">
              <MeetingBookedButton
                contactId={contact.id}
                campaignId={campaignId}
                alreadyBooked={contact.meeting_booked}
                disabled={!!contact.unsubscribed_at}
              />
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <div className="space-y-4">
          <OpenTrackingNotice />
          <Card>
            <CardHeader>
              <CardTitle>Activiteitenoverzicht</CardTitle>
            </CardHeader>
            <CardContent>
              {timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nog geen activiteit.</p>
              ) : (
                <ol className="space-y-3">
                  {timeline.map((item, i) => (
                    <li key={i} className="border-l-2 border-border pl-4 text-sm">
                      {item.kind === 'sent' && (
                        <div>
                          <span className="font-medium">
                            Stap {item.stepIndex}: &laquo;{subjectByStep[item.stepIndex] ?? `Stap ${item.stepIndex}`}&raquo; verzonden
                          </span>
                          <div className="text-xs text-muted-foreground">
                            {new Date(item.timestamp).toLocaleString('nl-BE')}
                          </div>
                        </div>
                      )}
                      {item.kind === 'opened' && (
                        <div>
                          <span className="font-medium">Stap {item.stepIndex} geopend</span>
                          <span className="ml-2 text-xs text-muted-foreground">(opening mogelijk onnauwkeurig)</span>
                          <div className="text-xs text-muted-foreground">
                            {new Date(item.timestamp).toLocaleString('nl-BE')}
                          </div>
                        </div>
                      )}
                      {item.kind === 'clicked' && (
                        <div>
                          <span className="font-medium">Stap {item.stepIndex}: link geklikt</span>
                          {item.url && (
                            <div className="mt-0.5 max-w-xs truncate text-xs text-muted-foreground" title={item.url}>
                              {item.url}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            {new Date(item.timestamp).toLocaleString('nl-BE')}
                          </div>
                        </div>
                      )}
                      {item.kind === 'replied' && (
                        <div>
                          <span className="font-medium">Antwoord ontvangen</span>
                          <div className="text-xs text-muted-foreground">
                            {new Date(item.timestamp).toLocaleString('nl-BE')}
                          </div>
                          {item.body && (
                            <details className="mt-1">
                              <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                                Bekijk bericht
                              </summary>
                              <pre className="mt-2 whitespace-pre-wrap rounded-md bg-muted p-2 text-xs">
                                {item.body}
                              </pre>
                            </details>
                          )}
                        </div>
                      )}
                      {item.kind === 'meeting' && (
                        <div>
                          <span className="font-medium">Vergadering gepland</span>
                          <div className="text-xs text-muted-foreground">
                            {new Date(item.timestamp).toLocaleString('nl-BE')}
                          </div>
                        </div>
                      )}
                      {item.kind === 'task_done' && (
                        <div>
                          <span className="font-medium">
                            {item.taskType === 'linkedin' ? 'LinkedIn-actie afgerond' : 'Telefoongesprek afgerond'}
                          </span>
                          <div className="text-xs text-muted-foreground">
                            {new Date(item.timestamp).toLocaleString('nl-BE')}
                          </div>
                          {item.notes && (
                            <div className="mt-1 rounded-md px-3 py-2 text-xs" style={{ background: 'var(--muted)', borderLeft: '2px solid var(--sc-orange, #f97316)' }}>
                              {item.notes}
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex gap-2">
      <span className="w-28 shrink-0 text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  )
}

function LinkRow({ label, href, display }: { label: string; href: string | null | undefined; display: string | null | undefined }) {
  if (!href || !display) return null
  const url = href.startsWith('http') ? href : `https://${href}`
  return (
    <div className="flex gap-2">
      <span className="w-28 shrink-0 text-muted-foreground">{label}</span>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:underline"
        style={{ color: 'var(--sc-orange, #f97316)', textDecoration: 'none', wordBreak: 'break-all' }}
      >
        {display}
      </a>
    </div>
  )
}
