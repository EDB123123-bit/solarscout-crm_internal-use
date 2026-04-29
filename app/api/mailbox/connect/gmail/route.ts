import { type NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
].join(' ')

export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const state = searchParams.get('state')

  // ── Phase B: OAuth callback ──────────────────────────────────────────────
  if (code || error) {
    if (error) {
      return NextResponse.redirect(
        new URL('/settings?mailbox_error=access_denied', req.url)
      )
    }

    // CSRF validation
    const storedState = req.cookies.get('oauth_state_gmail')?.value
    if (!storedState || storedState !== state) {
      return NextResponse.json(
        { error: 'Ongeldige sessiestatus.' },
        { status: 400 }
      )
    }

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code!,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/mailbox/connect/gmail`,
        grant_type: 'authorization_code',
      }).toString(),
    })

    if (!tokenRes.ok) {
      const response = NextResponse.redirect(
        new URL('/settings?mailbox_error=token_exchange_failed', req.url)
      )
      clearStateCookie(response)
      return response
    }

    const tokens = await tokenRes.json() as {
      access_token: string
      refresh_token?: string
      expires_in: number
    }

    if (!tokens.refresh_token) {
      const response = NextResponse.redirect(
        new URL('/settings?mailbox_error=no_refresh_token', req.url)
      )
      clearStateCookie(response)
      return response
    }

    // Fetch the user's Gmail address via the Gmail profile endpoint
    // (requires gmail.readonly scope, which we already request)
    const profileRes = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/profile',
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    )
    if (!profileRes.ok) {
      const response = NextResponse.redirect(
        new URL('/settings?mailbox_error=token_exchange_failed', req.url)
      )
      clearStateCookie(response)
      return response
    }
    const userinfo = await profileRes.json() as { emailAddress: string }

    // Get the authenticated SOT user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.redirect(new URL('/login', req.url))

    // Persist: delete any existing connection, then insert new one
    const db = createServiceClient()
    await db.from('mailbox_connections').delete().eq('user_id', user.id)
    const { error: dbError } = await db.from('mailbox_connections').insert({
      user_id: user.id,
      provider: 'gmail',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      email_address: userinfo.emailAddress,
      status: 'connected',
    })

    if (dbError) {
      const response = NextResponse.redirect(
        new URL('/settings?mailbox_error=db_error', req.url)
      )
      clearStateCookie(response)
      return response
    }

    const response = NextResponse.redirect(new URL('/', req.url))
    clearStateCookie(response)
    return response
  }

  // ── Phase A: Initiate OAuth ──────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', req.url))

  const csrfState = crypto.randomUUID()

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID!)
  authUrl.searchParams.set(
    'redirect_uri',
    `${process.env.NEXT_PUBLIC_APP_URL}/api/mailbox/connect/gmail`
  )
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', SCOPES)
  authUrl.searchParams.set('access_type', 'offline')
  authUrl.searchParams.set('prompt', 'consent')
  authUrl.searchParams.set('state', csrfState)

  const response = NextResponse.redirect(authUrl)
  response.cookies.set('oauth_state_gmail', csrfState, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 600,
    path: '/api/mailbox/connect/gmail',
    secure: process.env.NODE_ENV === 'production',
  })
  return response
}

function clearStateCookie(response: NextResponse) {
  response.cookies.set('oauth_state_gmail', '', {
    maxAge: 0,
    path: '/api/mailbox/connect/gmail',
  })
}
