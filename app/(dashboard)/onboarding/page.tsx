import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // If already connected, go straight to dashboard
  const { data: mailbox } = await supabase
    .from('mailbox_connections')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'connected')
    .maybeSingle()
  if (mailbox) redirect('/')

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 560,
        display: 'flex',
        flexDirection: 'column',
        gap: 32,
      }}>
        {/* Header */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#FFA500', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
            Stap 1 van 1
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.6px', marginBottom: 10 }}>
            Verbind je Gmail-account
          </h1>
          <p style={{ fontSize: 15, color: 'var(--muted-foreground)', lineHeight: 1.6 }}>
            Om campagnes te versturen heeft SolarScout toegang nodig tot je Gmail-account.
            Hieronder leggen we precies uit waarvoor.
          </p>
        </div>

        {/* Explanation card */}
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          overflow: 'hidden',
        }}>
          <PermissionRow
            icon={
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#FFA500" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3.5" width="16" height="11" rx="1.5" />
                <path d="M1 6.5l8 5 8-5" />
              </svg>
            }
            title="E-mails verzenden vanuit jouw adres"
            description="Outreach e-mails worden verstuurd vanuit jouw eigen Gmail-adres. Daardoor zien prospects een vertrouwde afzender en is de kans op aflevering in de inbox aanzienlijk hoger dan via een gedeeld verzendplatform."
          />
          <div style={{ height: 1, background: 'var(--border)' }} />
          <PermissionRow
            icon={
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#FFA500" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 9c0 3.9-3.1 7-7 7s-7-3.1-7-7 3.1-7 7-7" />
                <path d="M12 2l4 4-4 4" />
              </svg>
            }
            title="Antwoorden automatisch detecteren"
            description="SolarScout scant je inbox op antwoorden van prospects. Zodra iemand reageert, stopt de reeks automatisch. Zo stuur je nooit een opvolgmail naar iemand die al heeft geantwoord."
          />
          <div style={{ height: 1, background: 'var(--border)' }} />
          <PermissionRow
            icon={
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="8" width="12" height="8" rx="1.5" />
                <path d="M6 8V5.5a3 3 0 016 0V8" />
              </svg>
            }
            title="Alleen de toegang die nodig is"
            description="We vragen uitsluitend toestemming om e-mails te sturen en te lezen of er antwoorden zijn binnengekomen. We lezen geen persoonlijke e-mails, slaan geen berichtinhoud op en delen niets met derden."
          />
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <a
            href="/api/mailbox/connect/gmail"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              height: 50,
              background: '#FFA500',
              color: '#000',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 700,
              textDecoration: 'none',
              transition: 'background 0.15s',
            }}
          >
            <GoogleIcon />
            Gmail verbinden
          </a>
          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--sc-faint)', lineHeight: 1.5 }}>
            Je wordt doorgestuurd naar Google om toestemming te geven.
            Je kunt de verbinding op elk moment verbreken via Instellingen.
          </p>
        </div>
      </div>
    </div>
  )
}

function PermissionRow({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div style={{ display: 'flex', gap: 16, padding: '20px 24px' }}>
      <div style={{
        width: 40,
        height: 40,
        borderRadius: 8,
        background: 'rgba(255,165,0,0.08)',
        border: '1px solid rgba(255,165,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 13, color: 'var(--muted-foreground)', lineHeight: 1.55 }}>{description}</div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  )
}
