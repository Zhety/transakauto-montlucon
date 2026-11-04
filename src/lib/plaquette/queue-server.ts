import { canWriteLeads, createAdminSupabase } from '@/lib/supabase'
import type { PlaquetteQueueState, PlaquetteRequest, PlaquetteStatus } from './queue'

/** Les 30 dernières demandes, avec un lien signé pour celles qui sont prêtes. Serveur uniquement. */
export async function listPlaquetteRequests(): Promise<PlaquetteQueueState> {
  if (!canWriteLeads) return { requests: [], workerSeenAt: null, error: 'Supabase non configuré' }
  const admin = createAdminSupabase()

  const [{ data: rows, error }, { data: members }, { data: worker }] = await Promise.all([
    admin
      .from('plaquettes')
      .select('id, created_at, status, url, ref, title, agent, note, error, pdf_path, pdf_filename, requested_by, started_at, finished_at')
      .order('created_at', { ascending: false })
      .limit(30),
    admin.from('members').select('id, first_name, last_name'),
    admin.from('plaquette_worker').select('seen_at').eq('id', 'mac').maybeSingle(),
  ])

  if (error) {
    const missing = /relation .*plaquettes|schema cache/i.test(error.message)
    return {
      requests: [],
      workerSeenAt: null,
      error: missing
        ? 'La file d’attente n’existe pas encore : exécutez supabase/migrations/008_plaquettes.sql dans Supabase → SQL Editor.'
        : error.message,
    }
  }

  const names = new Map(
    (members ?? []).map((member) => [member.id as string, [member.first_name, member.last_name].filter(Boolean).join(' ')]),
  )

  const requests: PlaquetteRequest[] = await Promise.all(
    (rows ?? []).map(async (row) => {
      let downloadUrl: string | null = null
      if (row.status === 'prete' && row.pdf_path) {
        const { data } = await admin.storage
          .from('plaquettes')
          .createSignedUrl(row.pdf_path as string, 3600, { download: (row.pdf_filename as string | null) ?? undefined })
        downloadUrl = data?.signedUrl ?? null
      }
      return {
        id: row.id as string,
        created_at: row.created_at as string,
        status: row.status as PlaquetteStatus,
        url: row.url as string,
        ref: (row.ref as string | null) ?? null,
        title: (row.title as string | null) ?? null,
        agent: (row.agent as string | null) ?? null,
        note: (row.note as string | null) ?? null,
        error: (row.error as string | null) ?? null,
        pdf_filename: (row.pdf_filename as string | null) ?? null,
        download_url: downloadUrl,
        requested_by_name: row.requested_by ? (names.get(row.requested_by as string) ?? null) : null,
        started_at: (row.started_at as string | null) ?? null,
        finished_at: (row.finished_at as string | null) ?? null,
      }
    }),
  )

  return { requests, workerSeenAt: (worker?.seen_at as string | undefined) ?? null, error: null }
}
