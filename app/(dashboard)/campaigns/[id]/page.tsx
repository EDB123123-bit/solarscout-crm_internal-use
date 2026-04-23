import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { OpenTrackingNotice } from '@/components/open-tracking-notice'
import { EmptyState } from '@/components/empty-state'
import { PauseResumeButtons } from './pause-resume-buttons'
import { DeleteCampaignButton } from './delete-campaign-button'
import { CAMPAIGN_STATUS_LABEL, CAMPAIGN_STATUS_VARIANT } from '@/lib/ui/campaign-status'
import { CONTACT_STATUS_LABEL, CONTACT_STATUS_VARIANT } from '@/lib/ui/contact-status'
import type { Campaign, Contact } from '@/types'

type Params = Promise<{ id: string }>
type SearchParams = Promise<{ status?: string }>

const STATUS_FILTERS = [
  { value: '', label: 'Alle' },
  { value: 'not_contacted', label: 'Niet gecontacteerd' },
  { value: 'sent', label: 'Verzonden' },
  { value: 'opened', label: 'Geopend' },
  { value: 'replied', label: 'Beantwoord' },
  { value: 'unsubscribed', label: 'Uitgeschreven' },
]

export default async function CampaignDetailPage({
  params,
  searchParams,
}: {
  params: Params
  searchParams: SearchParams
}) {
  const { id } = await params
  const { status } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!data) redirect('/')
  const campaign = data as Campaign

  const baseContactsQuery = supabase
    .from('contacts')
    .select('*')
    .eq('campaign_id', campaign.id)
    .order('created_at', { ascending: true })

  const filteredContactsQuery = status === 'unsubscribed'
    ? baseContactsQuery.not('unsubscribed_at', 'is', null)
    : status
    ? baseContactsQuery.eq('status', status)
    : baseContactsQuery

  const [{ count: contactCount }, { count: sendCount }, { data: contactsRaw }, { data: clickEventsRaw }] = await Promise.all([
    supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', campaign.id),
    supabase
      .from('scheduled_sends')
      .select('id, contacts!inner(campaign_id)', { count: 'exact', head: true })
      .eq('contacts.campaign_id', campaign.id)
      .eq('step_index', 0),
    filteredContactsQuery,
    supabase
      .from('email_events')
      .select('contact_id, contacts!inner(campaign_id)', { count: 'exact' })
      .eq('event_type', 'clicked')
      .eq('contacts.campaign_id', campaign.id),
  ])

  const contacts = (contactsRaw ?? []) as Contact[]

  const clicksByContact: Record<string, number> = {}
  for (const ev of (clickEventsRaw ?? []) as { contact_id: string }[]) {
    clicksByContact[ev.contact_id] = (clicksByContact[ev.contact_id] ?? 0) + 1
  }

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
          <Link href="/" style={{ color: 'var(--sc-faint)', fontSize: 13, textDecoration: 'none' }}>
            Dashboard
          </Link>
          <span style={{ color: 'var(--sc-faint)', fontSize: 13 }}>/</span>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.4px' }}>{campaign.name}</div>
          <Badge variant={CAMPAIGN_STATUS_VARIANT[campaign.status] ?? 'secondary'}>
            {CAMPAIGN_STATUS_LABEL[campaign.status] ?? campaign.status}
          </Badge>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <DeleteCampaignButton campaignId={campaign.id} />
          <PauseResumeButtons campaignId={campaign.id} status={campaign.status} />
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 24, flex: 1 }}>
        {/* KPI tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <Tile label="Contacten" value={contactCount ?? 0} />
          <Tile label="Geplande verzendingen" value={sendCount ?? 0} />
          {campaign.launched_at && (
            <Tile label="Gestart op" value={new Date(campaign.launched_at).toLocaleDateString('nl-BE')} />
          )}
        </div>

        <OpenTrackingNotice />

        {/* Contacts table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.3px' }}>Contacten</div>
          </div>

          {/* Status filter chips */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {STATUS_FILTERS.map(({ value, label }) => {
              const active = (status ?? '') === value
              return (
                <Link
                  key={value}
                  href={value ? `/campaigns/${id}?status=${value}` : `/campaigns/${id}`}
                  style={{
                    fontSize: 12, fontWeight: 500, padding: '3px 10px', borderRadius: 99,
                    border: active ? '1px solid rgba(255,165,0,0.5)' : '1px solid var(--border)',
                    background: active ? 'rgba(255,165,0,0.12)' : 'var(--card)',
                    color: active ? '#FFA500' : 'var(--sc-faint)',
                    textDecoration: 'none', whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </Link>
              )
            })}
          </div>

          {contacts.length === 0 ? (
            <EmptyState title="Geen contacten" description="Geen contacten gevonden voor dit filter." />
          ) : (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Naam</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Bedrijf</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Klikken</TableHead>
                    <TableHead>Vergadering</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell className="font-medium">
                        {contact.first_name} {contact.last_name}
                        {contact.unsubscribed_at && (
                          <Badge variant="destructive" className="ml-2" style={{ fontSize: 10 }}>Uitgeschreven</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{contact.email}</TableCell>
                      <TableCell className="text-muted-foreground">{contact.company_name ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant={CONTACT_STATUS_VARIANT[contact.status] ?? 'outline'}>
                          {CONTACT_STATUS_LABEL[contact.status] ?? contact.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {clicksByContact[contact.id] ?? 0}
                      </TableCell>
                      <TableCell style={{ color: contact.meeting_booked ? '#22C55E' : 'var(--sc-faint)' }}>
                        {contact.meeting_booked ? '✓' : '—'}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/campaigns/${campaign.id}/contacts/${contact.id}`}
                          style={{ fontSize: 13, color: 'var(--muted-foreground)', textDecoration: 'none' }}
                        >
                          Details →
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Tile({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: '16px 20px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--sc-faint)' }}>{label}</div>
      <div style={{ marginTop: 8, fontSize: 28, fontWeight: 800, letterSpacing: '-1px', color: 'var(--foreground)' }}>{value}</div>
    </div>
  )
}
