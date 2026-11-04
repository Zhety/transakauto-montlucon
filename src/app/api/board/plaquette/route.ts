import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentMember } from '@/lib/board-auth'
import { buildPlaquette } from '@/lib/plaquette/build'
import { parseMandateUrl } from '@/lib/plaquette/mytransak-scrape'
import { listPlaquetteRequests } from '@/lib/plaquette/queue-server'
import { PlaquetteError } from '@/lib/plaquette/types'
import { canWriteLeads, createAdminSupabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
/**
 * Mode « rapide » : lecture de la fiche, 40 à 50 photos à redimensionner et
 * mise en page, sur Vercel. Si Vercel refuse cette valeur au déploiement (plan
 * sans Fluid compute), la ramener à 60.
 */
export const maxDuration = 300

const schema = z.object({
  url: z.string().trim().min(1, 'Lien manquant'),
  /** 'agent' : demande traitée par le Mac de l'agence (Claude Code) ; 'rapide' : PDF générique immédiat. */
  mode: z.enum(['agent', 'rapide']).default('agent'),
})

const STATUS: Record<PlaquetteError['kind'], number> = {
  config: 500,
  auth: 502,
  input: 422,
  notfound: 404,
  upstream: 502,
}

function failure(error: unknown) {
  console.error('[plaquette]', error)
  const status = error instanceof PlaquetteError ? STATUS[error.kind] : 500
  const message = error instanceof Error ? error.message : 'Erreur inconnue'
  return NextResponse.json({ ok: false, errors: [message] }, { status })
}

/** État de la file d'attente, pour le rafraîchissement de la page. */
export async function GET() {
  if (!(await getCurrentMember())) {
    return NextResponse.json({ ok: false, errors: ['Connexion requise'] }, { status: 401 })
  }
  return NextResponse.json({ ok: true, ...(await listPlaquetteRequests()) })
}

/** Dépose une demande (mode agent) ou renvoie tout de suite un PDF générique (mode rapide). */
export async function POST(request: Request) {
  const current = await getCurrentMember()
  if (!current) {
    return NextResponse.json({ ok: false, errors: ['Connexion requise'] }, { status: 401 })
  }

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.issues.map((issue) => issue.message) }, { status: 422 })
  }
  const { url, mode } = parsed.data

  try {
    parseMandateUrl(url)

    if (mode === 'agent') {
      if (!canWriteLeads) throw new PlaquetteError('Supabase non configuré', 'config')
      const { data, error } = await createAdminSupabase()
        .from('plaquettes')
        .insert({ url, requested_by: current.member.id, status: 'en_attente' })
        .select('id')
        .single()
      if (error) {
        const missing = /relation .*plaquettes|schema cache/i.test(error.message)
        throw new PlaquetteError(
          missing ? 'La file d’attente n’existe pas encore : exécutez la migration 008 dans Supabase.' : error.message,
          'upstream',
        )
      }
      return NextResponse.json({ ok: true, id: data.id })
    }

    const result = await buildPlaquette(url, { skipAgent: true })
    return new Response(new Uint8Array(result.pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${result.filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    return failure(error)
  }
}
