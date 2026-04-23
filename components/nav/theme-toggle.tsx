'use client'

import { useTheme } from '@/components/theme-provider'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggle}
      title={isDark ? 'Licht thema' : 'Donker thema'}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: 'var(--sc-faint)',
        padding: 4,
        borderRadius: 4,
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
      }}
    >
      {isDark ? (
        /* Sun icon — switch to light */
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="7.5" cy="7.5" r="2.5" />
          <path d="M7.5 1v1.5M7.5 12.5V14M1 7.5h1.5M12.5 7.5H14M3.05 3.05l1.06 1.06M10.89 10.89l1.06 1.06M10.89 4.11l1.06-1.06M3.05 11.95l1.06-1.06" />
        </svg>
      ) : (
        /* Moon icon — switch to dark */
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 8.5A6 6 0 016.5 2a6 6 0 100 11A6 6 0 0013 8.5z" />
        </svg>
      )}
    </button>
  )
}
