import { type NextRequest, NextResponse } from 'next/server'
import { verify } from '@/lib/unsubscribe-token'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

async function suppress(contactId: string, source: string): Promise<boolean> {
  const db = createServiceClient()
  const { error } = await db
    .from('contacts')
    .update({ unsubscribed_at: new Date().toISOString(), unsubscribed_source: source })
    .eq('id', contactId)
    .is('unsubscribed_at', null)

  if (error) {
    console.error('[/api/unsubscribe] DB update fout:', error.message)
    return false
  }

  // Cancel any pending scheduled sends for this contact
  await db
    .from('scheduled_sends')
    .update({ status: 'cancelled' })
    .eq('contact_id', contactId)
    .eq('status', 'pending')

  return true
}

// RFC 8058 one-click POST
export async function POST(req: NextRequest): Promise<Response> {
  const t = req.nextUrl.searchParams.get('t') ?? ''
  const parsed = verify(t)
  if (!parsed) return NextResponse.json({ error: 'Ongeldig token' }, { status: 404 })
  await suppress(parsed.contactId, 'one-click')
  return NextResponse.json({ ok: true })
}

// Link-click GET — renders a confirmation page
export async function GET(req: NextRequest): Promise<Response> {
  const t = req.nextUrl.searchParams.get('t') ?? ''
  const parsed = verify(t)
  if (!parsed) {
    return new Response('Ongeldige uitschrijflink.', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  }

  await suppress(parsed.contactId, 'link-click')

  const html = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Uitgeschreven</title>
  <style>
    body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f9fafb; color: #111; }
    .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 48px 40px; max-width: 420px; text-align: center; box-shadow: 0 1px 4px rgba(0,0,0,.06); }
    h1 { font-size: 22px; font-weight: 700; margin: 0 0 12px; }
    p { font-size: 15px; color: #6b7280; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Je bent uitgeschreven</h1>
    <p>Je ontvangt geen verdere e-mails meer van deze lijst.</p>
  </div>
</body>
</html>`

  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
