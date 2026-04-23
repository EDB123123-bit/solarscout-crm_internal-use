import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RepliesList, type ReplyRow } from './replies-list'

export default async function RepliesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: repliesRaw } = await supabase
    .from('replies')
    .select('id, body_text, received_at, raw_message_id, contacts!inner(id, first_name, last_name, email, company_name, campaign_id, campaigns!inner(id, name, user_id))')
    .eq('contacts.campaigns.user_id', user.id)
    .order('received_at', { ascending: false })

  const replies = (repliesRaw ?? []) as unknown as ReplyRow[]

  return (
    <div style={{ height: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        position: 'sticky', top: 0, zIndex: 5,
        background: 'var(--topbar-bg)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)', padding: '0 32px', height: 60,
        display: 'flex', alignItems: 'center', flexShrink: 0,
      }}>
        <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.4px' }}>Antwoorden</div>
      </div>
      <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 16, flex: 1, maxWidth: 860, width: '100%' }}>
        <RepliesList replies={replies} />
      </div>
    </div>
  )
}
