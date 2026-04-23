import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { OpenTrackingNotice } from '@/components/open-tracking-notice'
import { EmptyState } from '@/components/empty-state'
import { CAMPAIGN_STATUS_LABEL } from '@/lib/ui/campaign-status'
import type { Campaign } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // KPI: emails sent
  const { count: emailsSent } = await supabase
    .from('scheduled_sends')
    .select('id, contacts!inner(campaign_id, campaigns!inner(user_id))', { count: 'exact', head: true })
    .eq('status', 'sent')
    .eq('contacts.campaigns.user_id', user.id)

  // KPI: replies
  const { count: repliesCount } = await supabase
    .from('replies')
    .select('id, contacts!inner(campaign_id, campaigns!inner(user_id))', { count: 'exact', head: true })
    .eq('contacts.campaigns.user_id', user.id)

  // KPI: meetings booked
  const { count: meetingsBooked } = await supabase
    .from('contacts')
    .select('id, campaigns!inner(user_id)', { count: 'exact', head: true })
    .eq('meeting_booked', true)
    .eq('campaigns.user_id', user.id)

  const sent = emailsSent ?? 0
  const replies = repliesCount ?? 0
  const replyRate = sent > 0 ? ((replies / sent) * 100).toFixed(1) + '%' : '—'

  // Campaign list
  const { data: campaignsRaw } = await supabase
    .from('campaigns')
    .select('id, name, status, created_at, launched_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const campaigns = (campaignsRaw ?? []) as Campaign[]

  // Per-campaign stats
  const campaignStats = await Promise.all(
    campaigns.map(async (c) => {
      const [
        { count: total },
        { count: cSent },
        { count: cOpened },
        { count: cOpenedProxy },
        { count: cReplied },
        { count: cMeetings },
      ] = await Promise.all([
        supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('campaign_id', c.id),
        supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('campaign_id', c.id).neq('status', 'not_contacted'),
        supabase.from('email_events').select('id, contacts!inner(campaign_id)', { count: 'exact', head: true }).eq('event_type', 'opened').eq('contacts.campaign_id', c.id),
        supabase.from('email_events').select('id, contacts!inner(campaign_id)', { count: 'exact', head: true }).eq('event_type', 'opened_proxy').eq('contacts.campaign_id', c.id),
        supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('campaign_id', c.id).eq('status', 'replied'),
        supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('campaign_id', c.id).eq('meeting_booked', true),
      ])
      return {
        id: c.id,
        total: total ?? 0,
        sent: cSent ?? 0,
        opened: cOpened ?? 0,
        openedProxy: cOpenedProxy ?? 0,
        replied: cReplied ?? 0,
        meetings: cMeetings ?? 0,
      }
    })
  )
  const statsById = Object.fromEntries(campaignStats.map(s => [s.id, s]))

  return (
    <div style={{ height: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 5,
          background: 'var(--topbar-bg)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border)',
          padding: '0 32px',
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.4px' }}>Dashboard</div>
        <Link
          href="/campaigns/new"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            background: '#FFA500',
            color: '#000',
            border: 'none',
            borderRadius: 6,
            padding: '0 16px',
            height: 38,
            fontSize: 13.5,
            fontWeight: 600,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M7 1v12M1 7h12" />
          </svg>
          Nieuwe campagne
        </Link>
      </div>

      {/* Content */}
      <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 32, flex: 1 }}>

        {/* KPI grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <KpiCard
            label="E-mails verstuurd"
            value={sent}
            icon={
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#FFA500" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3.5" width="16" height="11" rx="1.5" />
                <path d="M1 6.5l8 5 8-5" />
              </svg>
            }
          />
          <KpiCard
            label="Antwoordpercentage"
            value={replyRate}
            valueColor="#FFA500"
            icon={
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#FFA500" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 9c0 3.9-3.1 7-7 7s-7-3.1-7-7 3.1-7 7-7" />
                <path d="M12 2l4 4-4 4" />
              </svg>
            }
          />
          <KpiCard
            label="Vergaderingen gepland"
            value={meetingsBooked ?? 0}
            valueColor="#22C55E"
            icon={
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#FFA500" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1.5" y="3" width="15" height="13" rx="1.5" />
                <path d="M1.5 7h15M5.5 1v4M12.5 1v4" />
              </svg>
            }
          />
        </div>

        <OpenTrackingNotice />

        {/* Campaigns section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.3px' }}>Campagnes</div>
          </div>

          {campaigns.length === 0 ? (
            <EmptyState
              title="Nog geen campagnes"
              description="Maak je eerste campagne aan om prospects te bereiken via gepersonaliseerde e-mails."
              action={
                <Link
                  href="/campaigns/new"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    background: '#FFA500',
                    color: '#000',
                    borderRadius: 6,
                    padding: '0 16px',
                    height: 38,
                    fontSize: 13.5,
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  Nieuwe campagne
                </Link>
              }
            />
          ) : (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Naam', 'Status', 'Contacten', 'Verstuurd', 'Geopend', 'Beantwoord', 'Vergaderingen', 'Gestart op'].map((h, i) => (
                      <th
                        key={h}
                        style={{
                          textAlign: i >= 2 && i <= 6 ? 'right' : 'left',
                          padding: '12px 20px',
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          color: 'var(--sc-faint)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => {
                    const s = statsById[campaign.id]
                    const openRate = s?.sent > 0 ? ((s.opened / s.sent) * 100).toFixed(0) : null
                    const replyRateC = s?.sent > 0 ? ((s.replied / s.sent) * 100).toFixed(0) : null
                    return (
                      <tr
                        key={campaign.id}
                        style={{ cursor: 'pointer', borderBottom: '1px solid rgba(42,42,42,0.6)' }}
                        className="campaign-row"
                      >
                        <td style={{ padding: '14px 20px', color: 'var(--foreground)', fontWeight: 600, fontSize: 14 }}>
                          <Link href={`/campaigns/${campaign.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                            {campaign.name}
                          </Link>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <StatusBadge status={campaign.status} />
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right', color: 'var(--muted-foreground)' }}>
                          {s?.total ?? 0}
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right', color: 'var(--muted-foreground)' }}>
                          {s?.sent ?? 0}
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right', minWidth: 110 }}>
                          {openRate !== null ? (
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF' }}>{openRate}%</div>
                              <div style={{ height: 4, background: 'var(--muted)', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
                                <div style={{ height: '100%', borderRadius: 2, background: '#FFA500', width: `${openRate}%` }} />
                              </div>
                              {(s?.openedProxy ?? 0) > 0 && (
                                <div style={{ fontSize: 10, color: 'var(--sc-faint)', marginTop: 2 }}>+{s.openedProxy} proxy</div>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--sc-faint)' }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right', minWidth: 110 }}>
                          {replyRateC !== null ? (
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#22C55E' }}>{replyRateC}%</div>
                              <div style={{ height: 4, background: 'var(--muted)', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
                                <div style={{ height: '100%', borderRadius: 2, background: '#22C55E', width: `${Math.min(Number(replyRateC) * 4, 100)}%` }} />
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--sc-faint)' }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right', color: s?.meetings > 0 ? 'var(--foreground)' : 'var(--sc-faint)', fontWeight: s?.meetings > 0 ? 600 : 400 }}>
                          {s?.meetings ?? 0}
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--sc-faint)' }}>
                          {campaign.launched_at
                            ? new Date(campaign.launched_at).toLocaleDateString('nl-BE')
                            : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

function KpiCard({
  label,
  value,
  icon,
  valueColor,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  valueColor?: string
}) {
  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle glow top-right */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'rgba(255,165,0,0.08)',
          filter: 'blur(20px)',
          pointerEvents: 'none',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>
          {label}
        </div>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 8,
            background: 'rgba(255,165,0,0.12)',
            border: '1px solid rgba(255,165,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      </div>
      <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1, color: valueColor ?? 'var(--foreground)' }}>
        {value}
      </div>
    </div>
  )
}

const STATUS_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  draft:     { bg: 'rgba(90,90,90,0.15)',     color: 'var(--muted-foreground)', border: 'rgba(90,90,90,0.3)' },
  active:    { bg: 'rgba(255,165,0,0.12)',    color: '#FFA500', border: 'rgba(255,165,0,0.25)' },
  paused:    { bg: 'rgba(245,158,11,0.12)',   color: '#F59E0B', border: 'rgba(245,158,11,0.25)' },
  completed: { bg: 'rgba(34,197,94,0.10)',    color: '#22C55E', border: 'rgba(34,197,94,0.22)' },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.draft
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 9px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        border: `1px solid ${s.border}`,
        background: s.bg,
        color: s.color,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
      {CAMPAIGN_STATUS_LABEL[status] ?? status}
    </span>
  )
}
