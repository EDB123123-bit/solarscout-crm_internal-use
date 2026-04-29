'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { register } from '../actions'
import { SolarScoutLogo } from '@/components/nav/solarscout-logo'

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError(null)
    const password = formData.get('password') as string
    const confirm = formData.get('confirmPassword') as string
    if (password !== confirm) {
      setError('Wachtwoorden komen niet overeen.')
      return
    }
    startTransition(async () => {
      const result = await register(formData)
      if (result?.error) setError(result.error)
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

  function onFocus(e: React.FocusEvent<HTMLInputElement>) {
    e.target.style.borderColor = '#FFA500'
    e.target.style.boxShadow = '0 0 0 3px rgba(255,165,0,0.12)'
  }
  function onBlur(e: React.FocusEvent<HTMLInputElement>) {
    e.target.style.borderColor = 'var(--border)'
    e.target.style.boxShadow = 'none'
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
      {/* Logo */}
      <div className="flex flex-col items-center gap-2 mb-8">
        <SolarScoutLogo width={180} />
        <div style={{ fontSize: 11, color: 'var(--sc-faint)' }}>Outreach Tool</div>
      </div>

      <div style={{ height: 1, background: 'var(--border)', marginBottom: 28 }} />

      <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px', marginBottom: 6 }}>Account aanmaken</h1>
      <p style={{ fontSize: 14, color: 'var(--muted-foreground)', marginBottom: 28 }}>Maak een gratis account aan om te starten.</p>

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
        {/* First + Last name side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="flex flex-col gap-1.5">
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted-foreground)' }} htmlFor="first_name">
              Voornaam
            </label>
            <input
              id="first_name"
              name="first_name"
              type="text"
              placeholder="Jan"
              required
              autoComplete="given-name"
              style={inputStyle}
              onFocus={onFocus}
              onBlur={onBlur}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted-foreground)' }} htmlFor="last_name">
              Achternaam
            </label>
            <input
              id="last_name"
              name="last_name"
              type="text"
              placeholder="Janssen"
              required
              autoComplete="family-name"
              style={inputStyle}
              onFocus={onFocus}
              onBlur={onBlur}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted-foreground)' }} htmlFor="company_name">
            Bedrijfsnaam
          </label>
          <input
            id="company_name"
            name="company_name"
            type="text"
            placeholder="Mijn Bedrijf BV"
            required
            autoComplete="organization"
            style={inputStyle}
            onFocus={onFocus}
            onBlur={onBlur}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted-foreground)' }} htmlFor="company_vat">
            BTW-nummer
          </label>
          <input
            id="company_vat"
            name="company_vat"
            type="text"
            placeholder="BE0123456789"
            required
            autoComplete="off"
            style={inputStyle}
            onFocus={onFocus}
            onBlur={onBlur}
          />
        </div>

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
            onFocus={onFocus}
            onBlur={onBlur}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted-foreground)' }} htmlFor="password">
            Wachtwoord
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            autoComplete="new-password"
            minLength={8}
            style={inputStyle}
            onFocus={onFocus}
            onBlur={onBlur}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted-foreground)' }} htmlFor="confirmPassword">
            Wachtwoord bevestigen
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            required
            autoComplete="new-password"
            minLength={8}
            style={inputStyle}
            onFocus={onFocus}
            onBlur={onBlur}
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
          {isPending ? 'Account aanmaken...' : 'Account aanmaken'}
        </button>
      </form>

      <p style={{ textAlign: 'center', fontSize: 13.5, color: 'var(--muted-foreground)', marginTop: 24 }}>
        Al een account?{' '}
        <Link href="/login" style={{ color: '#FFA500', textDecoration: 'none', fontWeight: 600 }}>
          Log in
        </Link>
      </p>
    </div>
  )
}
