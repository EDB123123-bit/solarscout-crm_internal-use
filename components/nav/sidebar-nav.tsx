'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: '/',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="1" width="6" height="6" rx="1.5" />
        <rect x="9" y="1" width="6" height="6" rx="1.5" />
        <rect x="1" y="9" width="6" height="6" rx="1.5" />
        <rect x="9" y="9" width="6" height="6" rx="1.5" />
      </svg>
    ),
  },
  {
    label: 'Campagnes',
    href: '/campaigns',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M2 4h12M2 8h12M2 12h8" />
      </svg>
    ),
  },
  {
    label: 'Contacten',
    href: '/contacts',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="5" r="2.5" />
        <path d="M1 13c0-2.8 2.2-5 5-5s5 2.2 5 5" />
        <path d="M11 7a2 2 0 1 0 0-4M15 13c0-2-1.3-3.7-3-4.4" />
      </svg>
    ),
  },
  {
    label: 'Antwoorden',
    href: '/replies',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 10c0 .6-.5 1-1 1H4l-3 3V3c0-.6.4-1 1-1h11c.5 0 1 .4 1 1v7z" />
      </svg>
    ),
  },
]

const SETTINGS_ITEM = {
  label: 'Instellingen',
  href: '/settings',
  icon: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="8" r="2.5" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.42 1.42M11.53 11.53l1.42 1.42M12.95 3.05l-1.42 1.42M4.47 11.53l-1.42 1.42" />
    </svg>
  ),
}

export function SidebarNav() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  function itemStyle(active: boolean): React.CSSProperties {
    return {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '9px 10px',
      borderRadius: 6,
      fontSize: 13.5,
      fontWeight: active ? 600 : 500,
      color: active ? '#FFA500' : '#A0A0A0',
      background: active ? 'rgba(255,165,0,0.12)' : 'none',
      textDecoration: 'none',
      position: 'relative',
      transition: 'background 0.12s, color 0.12s',
      width: '100%',
    }
  }

  return (
    <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#5A5A5A', padding: '10px 8px 5px' }}>
        Hoofdmenu
      </div>

      {NAV_ITEMS.map(({ label, href, icon }) => {
        const active = isActive(href)
        return (
          <Link
            key={href}
            href={href}
            style={itemStyle(active)}
            className="sidebar-nav-item"
          >
            {active && (
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 6,
                  bottom: 6,
                  width: 3,
                  background: '#FFA500',
                  borderRadius: '0 2px 2px 0',
                }}
              />
            )}
            <span style={{ opacity: active ? 1 : 0.7, display: 'flex', alignItems: 'center' }}>
              {icon}
            </span>
            {label}
          </Link>
        )
      })}

      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#5A5A5A', padding: '14px 8px 5px' }}>
        Beheer
      </div>

      {(() => {
        const active = isActive(SETTINGS_ITEM.href)
        return (
          <Link
            href={SETTINGS_ITEM.href}
            style={itemStyle(active)}
            className="sidebar-nav-item"
          >
            {active && (
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 6,
                  bottom: 6,
                  width: 3,
                  background: '#FFA500',
                  borderRadius: '0 2px 2px 0',
                }}
              />
            )}
            <span style={{ opacity: active ? 1 : 0.7, display: 'flex', alignItems: 'center' }}>
              {SETTINGS_ITEM.icon}
            </span>
            {SETTINGS_ITEM.label}
          </Link>
        )
      })()}
    </nav>
  )
}
