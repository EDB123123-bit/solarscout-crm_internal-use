import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TaskCard } from '@/components/taken/task-card'

type TaskRow = {
  id: string
  task_type: string
  due_at: string
  contact_id: string
  campaign_id: string
  first_name: string
  last_name: string | null
  company_name: string | null
  phone: string | null
  general_phone: string | null
  linkedin_url: string | null
  campaign_name: string
}

function formatDueDate(due: string): { label: string; urgent: boolean } {
  const now = new Date()
  const d = new Date(due)
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return { label: 'Verlopen', urgent: true }
  if (diffDays === 0) return { label: 'Vandaag', urgent: true }
  if (diffDays === 1) return { label: 'Morgen', urgent: false }
  return { label: d.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' }), urgent: false }
}

export default async function TakenPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rawTasks } = await supabase
    .from('contact_tasks')
    .select(`
      id, task_type, due_at, contact_id, campaign_id,
      contacts!inner ( first_name, last_name, company_name, phone, general_phone, linkedin_url ),
      campaigns!inner ( name, user_id )
    `)
    .eq('campaigns.user_id', user.id)
    .is('completed_at', null)
    .order('due_at', { ascending: true })

  const allTasks: TaskRow[] = (rawTasks ?? []).map((r: any) => ({
    id: r.id,
    task_type: r.task_type,
    due_at: r.due_at,
    contact_id: r.contact_id,
    campaign_id: r.campaign_id,
    first_name: r.contacts.first_name,
    last_name: r.contacts.last_name,
    company_name: r.contacts.company_name,
    phone: r.contacts.phone,
    general_phone: r.contacts.general_phone,
    linkedin_url: r.contacts.linkedin_url,
    campaign_name: r.campaigns.name,
  }))

  // Filter out contacts who have replied
  let tasks = allTasks
  if (allTasks.length > 0) {
    const contactIds = [...new Set(allTasks.map((t) => t.contact_id))]
    const { data: replies } = await supabase
      .from('replies')
      .select('contact_id')
      .in('contact_id', contactIds)
    const repliedIds = new Set((replies ?? []).map((r: any) => r.contact_id))
    tasks = allTasks.filter((t) => !repliedIds.has(t.contact_id))
  }

  return (
    <div style={{ height: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* Topbar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 5,
        background: 'var(--topbar-bg)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)', padding: '0 32px', height: 60,
        display: 'flex', alignItems: 'center', flexShrink: 0,
      }}>
        <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.4px' }}>Taken</div>
        {tasks.length > 0 && (
          <span style={{
            marginLeft: 10, fontSize: 12, fontWeight: 600,
            background: 'var(--sc-orange, #f97316)', color: '#fff',
            borderRadius: 10, padding: '1px 7px',
          }}>
            {tasks.length}
          </span>
        )}
        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted-foreground)' }}>
          Klik op het vakje links om een taak af te ronden
        </div>
      </div>

      <div className="mx-auto max-w-2xl w-full p-8 space-y-3">
        {tasks.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '60px 0',
            color: 'var(--muted-foreground)', fontSize: 14,
          }}>
            Geen openstaande taken. Goed bezig!
          </div>
        )}

        {tasks.map((task) => {
          const { label: dueLabel, urgent } = formatDueDate(task.due_at)
          return (
            <TaskCard
              key={task.id}
              taskId={task.id}
              taskType={task.task_type}
              firstName={task.first_name}
              lastName={task.last_name}
              companyName={task.company_name}
              linkedinUrl={task.linkedin_url}
              phone={task.phone ?? task.general_phone}
              campaignName={task.campaign_name}
              campaignId={task.campaign_id}
              contactId={task.contact_id}
              dueLabel={dueLabel}
              urgent={urgent}
            />
          )
        })}
      </div>
    </div>
  )
}
