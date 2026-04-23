import { type NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = req.nextUrl
  const cid = searchParams.get('cid')
  const step = searchParams.get('step')
  const url = searchParams.get('url')

  if (cid && step !== null && url) {
    const stepIndex = parseInt(step, 10)
    if (!isNaN(stepIndex)) {
      try {
        const db = createServiceClient()
        const { error } = await db.from('email_events').insert({
          contact_id: cid,
          step_index: stepIndex,
          event_type: 'clicked',
          timestamp: new Date().toISOString(),
          message_id: null,
          url,
        })
        if (error) console.error('[track/click] insert error:', error.message, error.details)
      } catch (err) {
        console.error('[track/click] unexpected error:', err)
      }
    }
  }

  // Always redirect to the original URL, or fall back to homepage
  const destination = url ?? '/'
  return NextResponse.redirect(destination)
}
