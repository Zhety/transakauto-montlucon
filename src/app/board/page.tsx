import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { LeadsBoard } from '@/components/board/leads-board'
import type { LeadRow, Member } from '@/lib/leads-board'
import { createServerSupabase, isSupabaseConfigured } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default async function BoardPage() {
  if (!isSupabaseConfigured) redirect('/board/login')

  const supabase = createServerSupabase(await cookies())

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/board/login')

  const [{ data: leads }, { data: members }] = await Promise.all([
    supabase.from('leads').select('*').order('created_at', { ascending: false }),
    supabase.from('members').select('id, first_name, last_name').order('first_name'),
  ])

  return (
    <LeadsBoard
      initialLeads={(leads ?? []) as LeadRow[]}
      members={(members ?? []) as Member[]}
      currentEmail={user.email ?? ''}
    />
  )
}
