import { redirect } from 'next/navigation'
import { UsersManager } from '@/components/board/users-manager'
import { getCurrentMember } from '@/lib/board-auth'
import { boardHref } from '@/lib/board-path'
import { currentBoardBase } from '@/lib/board-path-server'
import type { Member } from '@/lib/leads-board'
import { createAdminSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default async function BoardUsersPage() {
  const base = await currentBoardBase()
  const current = await getCurrentMember()
  if (!current) redirect(boardHref(base, 'login'))
  if (current.member.role !== 'admin') redirect(boardHref(base, ''))

  const admin = createAdminSupabase()
  const [{ data: members }, { data: users }] = await Promise.all([
    admin.from('members').select('id, first_name, last_name, role').order('first_name'),
    // L'email vit côté auth, pas dans `members` : on le rapproche par id.
    admin.auth.admin.listUsers({ perPage: 500 }),
  ])

  const emails = new Map((users?.users ?? []).map((user) => [user.id, user.email ?? '']))
  const list = ((members ?? []) as Member[]).map((member) => ({ ...member, email: emails.get(member.id) ?? '' }))

  return <UsersManager initialMembers={list} currentId={current.member.id} base={base} />
}
