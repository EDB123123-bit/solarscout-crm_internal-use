import { type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// 1x1 transparent GIF
const GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
)

// Known proxy/bot UA fragments — opens from these are flagged as proxy opens
// and excluded from the "geopend" count shown in the dashboard.
const PROXY_UA_PATTERNS = [
  'AppleExchangeWebServices',
  'AppleMailPrivacyProxy',
  'Googlebot',
  'YahooMailProxy',
  'LinkedInBot',
]

function isProxyUserAgent(ua: string): boolean {
  return PROXY_UA_PATTERNS.some(p => ua.includes(p))
}

export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = req.nextUrl
  const cid = searchParams.get('cid')
  const step = searchParams.get('step')

  if (cid && step !== null) {
    const stepIndex = parseInt(step, 10)
    if (!isNaN(stepIndex)) {
      try {
        const db = createServiceClient()
        const now = new Date().toISOString()
        const ua = req.headers.get('user-agent') ?? ''
        const proxy = isProxyUserAgent(ua)

        const { error: insertErr } = await db.from('email_events').insert({
          contact_id: cid,
          step_index: stepIndex,
          event_type: proxy ? 'opened_proxy' : 'opened',
          timestamp: now,
          message_id: null,
          user_agent: ua || null,
        })
        if (insertErr) console.error('[track/open] insert error:', insertErr.message, insertErr.details)

        // Only flip sent → opened for real (non-proxy) opens
        if (!proxy) {
          await db
            .from('contacts')
            .update({ status: 'opened' })
            .eq('id', cid)
            .eq('status', 'sent')
        }
      } catch {
        // Never error a mail client — always return the GIF
      }
    }
  }

  return new Response(GIF, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
    },
  })
}
