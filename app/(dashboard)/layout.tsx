import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/(auth)/actions'
import { SidebarNav } from '@/components/nav/sidebar-nav'
import { SolarScoutLogo } from '@/components/nav/solarscout-logo'
import { ThemeToggle } from '@/components/nav/theme-toggle'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const initials = (user.email ?? 'U')
    .split('@')[0]
    .slice(0, 2)
    .toUpperCase()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 240,
          flexShrink: 0,
          background: 'var(--sidebar)',
          borderRight: '1px solid var(--sidebar-border)',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 10,
        }}
      >
        {/* Brand */}
        <div
          style={{
            padding: '22px 18px 18px',
            borderBottom: '1px solid var(--sidebar-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            flexShrink: 0,
          }}
        >
          <SolarScoutLogo width={120} />
          <div style={{ fontSize: 10, color: 'var(--sc-faint)', fontWeight: 500, paddingLeft: 1 }}>
            Outreach Tool
          </div>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, padding: '14px 10px', overflowY: 'auto' }}>
          <SidebarNav />
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 10px',
            borderTop: '1px solid var(--sidebar-border)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--muted)',
              border: '1.5px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700,
              color: '#FFA500',
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: 'var(--muted-foreground)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user.email}
            </div>
          </div>
          <ThemeToggle />
          <form action={logout}>
            <button
              type="submit"
              title="Afmelden"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--sc-faint)',
                padding: 4,
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2H2.5A1.5 1.5 0 001 3.5v8A1.5 1.5 0 002.5 13H6" />
                <path d="M10 10l3-3-3-3M13 7.5H6" />
              </svg>
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ marginLeft: 240, flex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  )
}
