import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { LeadsBoard } from '@/components/board/leads-board'
import { getCurrentMember } from '@/lib/board-auth'
import { boardHref } from '@/lib/board-path'
import { currentBoardBase } from '@/lib/board-path-server'
import type { LeadNote, LeadRow, Member } from '@/lib/leads-board'
import { createServerSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default async function BoardPage() {
  const base = await currentBoardBase()
  const current = await getCurrentMember()
  if (!current) redirect(boardHref(base, 'login'))

  // Lectures soumises à RLS : l'utilisateur ne voit que ce que les règles lui
  // accordent, la clé de service ne sert qu'à l'identifier.
  const supabase = createServerSupabase(await cookies())
  const [{ data: leads }, { data: members }, { data: notes }] = await Promise.all([
    supabase.from('leads').select('*').order('created_at', { ascending: false }),
    supabase.from('members').select('id, first_name, last_name, role').order('first_name'),
    // Journal des appels de toutes les fiches ; tant que la migration 005 n'est
    // pas passée, la requête échoue et le tableau s'affiche sans notes.
    supabase.from('lead_notes').select('*').order('created_at', { ascending: false }),
  ])

  return (
    <LeadsBoard
      initialLeads={(leads ?? []) as LeadRow[]}
      initialNotes={(notes ?? []) as LeadNote[]}
      members={(members ?? []) as Member[]}
      current={current}
      base={base}
    />
  )
}
