import { createServiceClient } from '@/lib/supabase/server'

const TOKEN_BUFFER_MS = 5 * 60 * 1000 // 5-minute buffer before expiry

export async function getValidAccessToken(userId: string): Promise<string> {
  const db = createServiceClient()

  const { data: conn, error } = await db
    .from('mailbox_connections')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw new Error(`Mailbox ophalen mislukt: ${error.message}`)
  if (!conn) throw new Error('Geen mailbox verbonden voor deze gebruiker.')
  if (conn.status === 'disconnected') {
    throw new Error('Mailbox verbinding verbroken. Herverbind in Instellingen.')
  }

  const expiresAt = new Date(conn.token_expires_at).getTime()
  if (Date.now() < expiresAt - TOKEN_BUFFER_MS) {
    return conn.access_token
  }

  // Token expired — attempt silent refresh
  const isGmail = conn.provider === 'gmail'

  const tokenUrl = isGmail
    ? 'https://oauth2.googleapis.com/token'
    : `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: conn.refresh_token,
    client_id: isGmail
      ? process.env.GOOGLE_CLIENT_ID!
      : process.env.AZURE_CLIENT_ID!,
    client_secret: isGmail
      ? process.env.GOOGLE_CLIENT_SECRET!
      : process.env.AZURE_CLIENT_SECRET!,
    ...(isGmail ? {} : { scope: 'offline_access Mail.Send Mail.Read' }),
  })

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!res.ok) {
    await db
      .from('mailbox_connections')
      .update({ status: 'disconnected' })
      .eq('id', conn.id)
    throw new Error(
      'Token vernieuwen mislukt. Herverbind uw mailbox in Instellingen.'
    )
  }

  const tokens = await res.json() as {
    access_token: string
    expires_in: number
    refresh_token?: string
  }

  const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

  await db
    .from('mailbox_connections')
    .update({
      access_token: tokens.access_token,
      // Only replace refresh_token if provider returned a new one
      ...(tokens.refresh_token ? { refresh_token: tokens.refresh_token } : {}),
      token_expires_at: newExpiresAt,
      status: 'connected',
    })
    .eq('id', conn.id)

  return tokens.access_token
}
