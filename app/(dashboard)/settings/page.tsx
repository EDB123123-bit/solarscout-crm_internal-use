import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { disconnectMailbox } from './actions'
import type { MailboxConnection } from '@/types'

type Props = {
  // Next.js 15: searchParams is a Promise
  searchParams: Promise<{ mailbox_error?: string }>
}

const ERROR_MESSAGES: Record<string, string> = {
  access_denied:
    'U heeft de toegang tot uw mailbox geweigerd.',
  token_exchange_failed:
    'Er is een fout opgetreden bij het verbinden. Probeer opnieuw.',
  no_refresh_token:
    'Geen vernieuwingstoken ontvangen. Verwijder de app-toegang in uw Google-account en probeer opnieuw.',
  db_error:
    'Er is een databasefout opgetreden. Probeer opnieuw.',
}

export default async function SettingsPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: mailbox } = await supabase
    .from('mailbox_connections')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  const params = await searchParams
  const errorMessage = params.mailbox_error
    ? ERROR_MESSAGES[params.mailbox_error] ?? 'Er is een onbekende fout opgetreden.'
    : null

  return (
    <div style={{ height: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        position: 'sticky', top: 0, zIndex: 5,
        background: 'var(--topbar-bg)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)', padding: '0 32px', height: 60,
        display: 'flex', alignItems: 'center', flexShrink: 0,
      }}>
        <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.4px' }}>Instellingen</div>
      </div>
      <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 16, flex: 1, maxWidth: 680, width: '100%' }}>
        {errorMessage && (
          <div style={{ borderRadius: 6, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.10)', padding: '12px 16px', fontSize: 13, color: '#EF4444' }}>
            {errorMessage}
          </div>
        )}
        <MailboxCard mailbox={mailbox} />
      </div>
    </div>
  )
}

function MailboxCard({ mailbox }: { mailbox: MailboxConnection | null }) {
  if (!mailbox) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mailbox</CardTitle>
          <CardDescription>
            Verbind uw Gmail of Outlook account om e-mails te versturen.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <a href="/api/mailbox/connect/gmail">
            <Button>Gmail verbinden</Button>
          </a>
          <a href="/api/mailbox/connect/outlook">
            <Button variant="outline">Outlook verbinden</Button>
          </a>
        </CardContent>
      </Card>
    )
  }

  const providerLabel = mailbox.provider === 'gmail' ? 'Gmail' : 'Outlook'
  const reconnectHref = `/api/mailbox/connect/${mailbox.provider}`
  const isDisconnected = mailbox.status === 'disconnected'

  if (isDisconnected) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle>Mailbox</CardTitle>
          <CardDescription className="text-destructive font-medium">
            Verbindingsfout
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            De verbinding met uw {providerLabel}-mailbox is verbroken. Herverbind
            om e-mails te blijven versturen.
          </div>
          <a href={reconnectHref}>
            <Button>Herverbinden</Button>
          </a>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mailbox</CardTitle>
        <CardDescription>Verbonden account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <ProviderBadge provider={mailbox.provider} />
          <span className="text-sm">{mailbox.email_address}</span>
        </div>
        <div className="flex gap-3">
          <a href={reconnectHref}>
            <Button variant="outline">Herverbinden</Button>
          </a>
          <form action={disconnectMailbox}>
            <Button variant="destructive" type="submit">
              Verbinding verbreken
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}

function ProviderBadge({ provider }: { provider: string }) {
  const isGmail = provider === 'gmail'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      borderRadius: 99, padding: '2px 10px',
      fontSize: 12, fontWeight: 600,
      background: isGmail ? 'rgba(239,68,68,0.12)' : 'rgba(96,165,250,0.12)',
      color: isGmail ? '#EF4444' : '#60A5FA',
      border: `1px solid ${isGmail ? 'rgba(239,68,68,0.25)' : 'rgba(96,165,250,0.25)'}`,
    }}>
      {isGmail ? 'Gmail' : 'Outlook'}
    </span>
  )
}
