import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentMember } from '@/lib/board-auth'
import { buildPlaquette } from '@/lib/plaquette/build'
import { PlaquetteError } from '@/lib/plaquette/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
/**
 * Lecture de la fiche, 40 à 50 photos à redimensionner, rédaction par l'agent
 * puis mise en page : une à deux minutes. Si Vercel refuse cette valeur au
 * déploiement (plan sans Fluid compute), la ramener à 60.
 */
export const maxDuration = 300

const schema = z.object({ url: z.string().trim().min(1, 'Lien manquant') })

const STATUS: Record<PlaquetteError['kind'], number> = {
  config: 500,
  auth: 502,
  input: 422,
  notfound: 404,
  upstream: 502,
}

/** Lien de fiche mandat mytransak → PDF de la plaquette, en téléchargement. */
export async function POST(request: Request) {
  if (!(await getCurrentMember())) {
    return NextResponse.json({ ok: false, errors: ['Connexion requise'] }, { status: 401 })
  }

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.issues.map((issue) => issue.message) }, { status: 422 })
  }

  try {
    const result = await buildPlaquette(parsed.data.url)
    const headers: Record<string, string> = {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${result.filename}"`,
      'Cache-Control': 'no-store',
      'X-Plaquette-Agent': result.agentUsed ? 'claude' : 'generique',
    }
    if (result.agentError) headers['X-Plaquette-Agent-Error'] = encodeURIComponent(result.agentError)
    return new Response(new Uint8Array(result.pdf), { headers })
  } catch (error) {
    console.error('[plaquette]', error)
    const status = error instanceof PlaquetteError ? STATUS[error.kind] : 500
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ ok: false, errors: [message] }, { status })
  }
}
