import { type NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const SCOPES = 'offline_access Mail.Send Mail.Read'

export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const state = searchParams.get('state')
  const tenant = process.env.AZURE_TENANT_ID ?? 'common'

  // ── Phase B: OAuth callback ──────────────────────────────────────────────
  if (code || error) {
    if (error) {
      return NextResponse.redirect(
        new URL('/settings?mailbox_error=access_denied', req.url)
      )
    }

    // CSRF validation
    const storedState = req.cookies.get('oauth_state_outlook')?.value
    if (!storedState || storedState !== state) {
      return NextResponse.json(
        { error: 'Ongeldige sessiestatus.' },
        { status: 400 }
      )
    }

    // Exchange code for tokens
    const tokenRes = await fetch(
      `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: code!,
          client_id: process.env.AZURE_CLIENT_ID!,
          client_secret: process.env.AZURE_CLIENT_SECRET!,
          redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/mailbox/connect/outlook`,
          grant_type: 'authorization_code',
          scope: SCOPES,
        }).toString(),
      }
    )

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

    // Fetch the user's Outlook email address
    const profileRes = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    if (!profileRes.ok) {
      const response = NextResponse.redirect(
        new URL('/settings?mailbox_error=token_exchange_failed', req.url)
      )
      clearStateCookie(response)
      return response
    }
    const profile = await profileRes.json() as {
      mail?: string
      userPrincipalName?: string
    }
    const emailAddress = profile.mail ?? profile.userPrincipalName ?? ''

    // Get the authenticated SOT user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.redirect(new URL('/login', req.url))

    // Persist: delete any existing connection, then insert new one
    const db = createServiceClient()
    await db.from('mailbox_connections').delete().eq('user_id', user.id)
    const { error: dbError } = await db.from('mailbox_connections').insert({
      user_id: user.id,
      provider: 'outlook',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      email_address: emailAddress,
      status: 'connected',
    })

    if (dbError) {
      const response = NextResponse.redirect(
        new URL('/settings?mailbox_error=db_error', req.url)
      )
      clearStateCookie(response)
      return response
    }

    const response = NextResponse.redirect(new URL('/settings', req.url))
    clearStateCookie(response)
    return response
  }

  // ── Phase A: Initiate OAuth ──────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', req.url))

  const csrfState = crypto.randomUUID()

  const authUrl = new URL(
    `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`
  )
  authUrl.searchParams.set('client_id', process.env.AZURE_CLIENT_ID!)
  authUrl.searchParams.set(
    'redirect_uri',
    `${process.env.NEXT_PUBLIC_APP_URL}/api/mailbox/connect/outlook`
  )
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', SCOPES)
  authUrl.searchParams.set('state', csrfState)

  const response = NextResponse.redirect(authUrl)
  response.cookies.set('oauth_state_outlook', csrfState, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 600,
    path: '/api/mailbox/connect/outlook',
    secure: process.env.NODE_ENV === 'production',
  })
  return response
}

function clearStateCookie(response: NextResponse) {
  response.cookies.set('oauth_state_outlook', '', {
    maxAge: 0,
    path: '/api/mailbox/connect/outlook',
  })
}
