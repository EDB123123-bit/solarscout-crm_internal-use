import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/empty-state'
import { CONTACT_STATUS_LABEL, CONTACT_STATUS_VARIANT } from '@/lib/ui/contact-status'
import type { Contact } from '@/types'

type SearchParams = Promise<{ status?: string }>

type ContactWithCampaign = Contact & {
  campaigns: { id: string; name: string }
}

const STATUS_FILTERS = [
  { value: '', label: 'Alle' },
  { value: 'not_contacted', label: 'Niet gecontacteerd' },
  { value: 'sent', label: 'Verzonden' },
  { value: 'opened', label: 'Geopend' },
  { value: 'replied', label: 'Beantwoord' },
  { value: 'unsubscribed', label: 'Uitgeschreven' },
]

export default async function ContactsPage({ searchParams }: { searchParams: SearchParams }) {
  const { status } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: allRaw } = await supabase
    .from('contacts')
    .select('*, campaigns!inner(id, name)')
    .order('created_at', { ascending: false })

  const all = (allRaw ?? []) as ContactWithCampaign[]

  const totalCount = all.length
  const repliedCount = all.filter(c => c.status === 'replied').length
  const meetingsCount = all.filter(c => c.meeting_booked).length
  const unsubscribedCount = all.filter(c => !!c.unsubscribed_at).length

  const contacts = status === 'unsubscribed'
    ? all.filter(c => !!c.unsubscribed_at)
    : status
    ? all.filter(c => c.status === status)
    : all

  return (
    <div style={{ height: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* Topbar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 5,
        background: 'var(--topbar-bg)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)', padding: '0 32px', height: 60,
        display: 'flex', alignItems: 'center', flexShrink: 0,
      }}>
        <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.4px' }}>Contacten</div>
      </div>

      <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 24, flex: 1 }}>
        {/* KPI tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <Tile label="Totaal" value={totalCount} />
          <Tile label="Beantwoord" value={repliedCount} />
          <Tile label="Vergaderingen" value={meetingsCount} />
          <Tile label="Uitgeschreven" value={unsubscribedCount} />
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {STATUS_FILTERS.map(({ value, label }) => {
            const active = (status ?? '') === value
            return (
              <Link
                key={value}
                href={value ? `/contacts?status=${value}` : '/contacts'}
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
                  <TableHead>Campagne</TableHead>
                  <TableHead>Status</TableHead>
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
                      <Link
                        href={`/campaigns/${contact.campaigns.id}`}
                        style={{ fontSize: 13, color: 'var(--sc-faint)', textDecoration: 'none' }}
                        className="hover:underline"
                      >
                        {contact.campaigns.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={CONTACT_STATUS_VARIANT[contact.status] ?? 'outline'}>
                        {CONTACT_STATUS_LABEL[contact.status] ?? contact.status}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ color: contact.meeting_booked ? '#22C55E' : 'var(--sc-faint)' }}>
                      {contact.meeting_booked ? '✓' : '—'}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/campaigns/${contact.campaigns.id}/contacts/${contact.id}`}
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
  )
}

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: '16px 20px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--sc-faint)' }}>{label}</div>
      <div style={{ marginTop: 8, fontSize: 28, fontWeight: 800, letterSpacing: '-1px', color: 'var(--foreground)' }}>{value}</div>
    </div>
  )
}
