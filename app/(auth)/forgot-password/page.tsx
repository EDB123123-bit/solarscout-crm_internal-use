'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { forgotPassword } from '../actions'
import { SolarScoutLogo } from '@/components/nav/solarscout-logo'

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await forgotPassword(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setSent(true)
      }
    })
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 44,
    padding: '0 14px',
    background: 'var(--input)',
    border: '1.5px solid var(--border)',
    borderRadius: 6,
    color: 'var(--foreground)',
    fontSize: 14,
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  }

  return (
    <div
      className="w-full"
      style={{
        maxWidth: 480,
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '48px 44px',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      <div className="flex flex-col items-center gap-2 mb-8">
        <SolarScoutLogo width={180} />
        <div style={{ fontSize: 11, color: 'var(--sc-faint)' }}>Outreach Tool — INTERNAL USE</div>
      </div>

      <div style={{ height: 1, background: 'var(--border)', marginBottom: 28 }} />

      <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px', marginBottom: 6 }}>Wachtwoord vergeten</h1>
      <p style={{ fontSize: 14, color: 'var(--muted-foreground)', marginBottom: 28 }}>
        Vul je e-mailadres in. Als er een account bestaat, sturen we je een herstellink.
      </p>

      {sent ? (
        <div
          style={{
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.25)',
            borderRadius: 6,
            padding: '16px 14px',
            fontSize: 14,
            color: '#86EFAC',
            marginBottom: 24,
          }}
        >
          Controleer je inbox — we hebben je een herstellink gestuurd.
        </div>
      ) : (
        <>
          {error && (
            <div
              className="flex items-start gap-2 mb-4"
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 6,
                padding: '12px 14px',
                fontSize: 13,
                color: '#FCA5A5',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="8" cy="8" r="7" stroke="#EF4444" strokeWidth="1.5" />
                <line x1="8" y1="5" x2="8" y2="8.5" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="8" cy="11" r="0.75" fill="#EF4444" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form action={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted-foreground)' }} htmlFor="email">
                E-mailadres
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="jouw@bedrijf.be"
                required
                autoComplete="email"
                style={inputStyle}
                onFocus={e => {
                  e.target.style.borderColor = '#FFA500'
                  e.target.style.boxShadow = '0 0 0 3px rgba(255,165,0,0.12)'
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'var(--border)'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              style={{
                width: '100%',
                height: 46,
                background: isPending ? 'rgba(255,165,0,0.5)' : '#FFA500',
                color: '#000000',
                border: 'none',
                borderRadius: 6,
                fontSize: 15,
                fontWeight: 700,
                cursor: isPending ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                transition: 'background 0.15s',
                marginTop: 4,
              }}
              onMouseEnter={e => { if (!isPending) (e.target as HTMLButtonElement).style.background = '#E59400' }}
              onMouseLeave={e => { if (!isPending) (e.target as HTMLButtonElement).style.background = '#FFA500' }}
            >
              {isPending ? 'Versturen...' : 'Stuur herstellink'}
            </button>
          </form>
        </>
      )}

      <p style={{ textAlign: 'center', fontSize: 13.5, color: 'var(--muted-foreground)', marginTop: 24 }}>
        <Link href="/login" style={{ color: '#FFA500', textDecoration: 'none', fontWeight: 600 }}>
          Terug naar inloggen
        </Link>
      </p>
    </div>
  )
}
