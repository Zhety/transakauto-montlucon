import { redirect } from 'next/navigation'
import { PlaquetteForm } from '@/components/board/plaquette-form'
import { getCurrentMember } from '@/lib/board-auth'
import { boardHref } from '@/lib/board-path'
import { currentBoardBase } from '@/lib/board-path-server'
import { memberName } from '@/lib/leads-board'
import { listPlaquetteRequests } from '@/lib/plaquette/queue-server'

export const dynamic = 'force-dynamic'

export default async function BoardPlaquettePage() {
  const base = await currentBoardBase()
  const current = await getCurrentMember()
  if (!current) redirect(boardHref(base, 'login'))

  const queue = await listPlaquetteRequests()

  return (
    <PlaquetteForm
      base={base}
      userName={memberName(current.member)}
      initialQueue={queue}
      mytransakConfigured={Boolean(process.env.MYTRANSAK_EMAIL && process.env.MYTRANSAK_PASSWORD)}
    />
  )
}
