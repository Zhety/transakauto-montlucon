import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { canWriteLeads, createAdminSupabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Interface du service tournant sur le Mac de l'agence. Il s'identifie avec le
 * jeton PLAQUETTE_WORKER_TOKEN (partagé entre Vercel et le Mac), réclame les
 * demandes en attente, puis dépose le PDF ou l'erreur.
 *
 *   GET  ?action=ping            signe de vie
 *   GET  ?action=claim           prend la plus ancienne demande en attente
 *   POST ?action=done&id=<uuid>  corps = PDF ; en-têtes x-plaquette-*
 *   POST ?action=fail&id=<uuid>  JSON { error }
 */
function authorized(request: Request): boolean {
  const expected = process.env.PLAQUETTE_WORKER_TOKEN
  const header = request.headers.get('authorization') ?? ''
  const given = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!expected || !given) return false
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

function denied() {
  return NextResponse.json({ ok: false, errors: ['Jeton du service invalide'] }, { status: 401 })
}

/** Message lisible quand la base n'est pas à jour : le service le répète dans son journal. */
function dbFailure(message: string) {
  const missing = /relation .*plaquette|schema cache/i.test(message)
  return NextResponse.json(
    {
      ok: false,
      errors: [missing ? 'Base non à jour : exécutez supabase/migrations/008_plaquettes.sql dans Supabase → SQL Editor' : message],
    },
    { status: 500 },
  )
}

export async function GET(request: Request) {
  if (!authorized(request)) return denied()
  if (!canWriteLeads) return NextResponse.json({ ok: false, errors: ['Supabase non configuré'] }, { status: 500 })

  const url = new URL(request.url)
  const action = url.searchParams.get('action')
  const admin = createAdminSupabase()

  const { error: pingError } = await admin
    .from('plaquette_worker')
    .upsert({ id: 'mac', seen_at: new Date().toISOString(), version: request.headers.get('x-plaquette-worker-version') })
  if (pingError) return dbFailure(pingError.message)

  if (action === 'ping') return NextResponse.json({ ok: true })

  if (action === 'claim') {
    const { data: next, error: nextError } = await admin
      .from('plaquettes')
      .select('id, url')
      .eq('status', 'en_attente')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    if (nextError) return dbFailure(nextError.message)
    if (!next) return NextResponse.json({ ok: true, request: null })

    // Prise exclusive : seul le passage en_attente → en_cours « gagne ».
    const { data: claimed, error: claimError } = await admin
      .from('plaquettes')
      .update({ status: 'en_cours', started_at: new Date().toISOString() })
      .eq('id', next.id)
      .eq('status', 'en_attente')
      .select('*')
      .maybeSingle()
    if (claimError) return dbFailure(claimError.message)
    return NextResponse.json({
      ok: true,
      request: claimed ? { id: claimed.id, url: claimed.url, road_fees_eur: (claimed.road_fees_eur as number | null | undefined) ?? null } : null,
    })
  }

  return NextResponse.json({ ok: false, errors: ['Action inconnue'] }, { status: 400 })
}

const failSchema = z.object({ error: z.string().min(1).max(2000) })

export async function POST(request: Request) {
  if (!authorized(request)) return denied()
  if (!canWriteLeads) return NextResponse.json({ ok: false, errors: ['Supabase non configuré'] }, { status: 500 })

  const url = new URL(request.url)
  const action = url.searchParams.get('action')
  const id = url.searchParams.get('id') ?? ''
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ ok: false, errors: ['Identifiant de demande invalide'] }, { status: 422 })
  }
  const admin = createAdminSupabase()

  if (action === 'fail') {
    const parsed = failSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return NextResponse.json({ ok: false, errors: ['Corps invalide'] }, { status: 422 })
    const { error } = await admin
      .from('plaquettes')
      .update({ status: 'erreur', error: parsed.data.error, finished_at: new Date().toISOString() })
      .eq('id', id)
    if (error) return NextResponse.json({ ok: false, errors: [error.message] }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'done') {
    const pdf = Buffer.from(await request.arrayBuffer())
    if (pdf.length < 1000 || pdf.subarray(0, 4).toString() !== '%PDF') {
      return NextResponse.json({ ok: false, errors: ['Le corps doit être un PDF'] }, { status: 422 })
    }
    const decode = (name: string) => {
      const value = request.headers.get(name)
      return value ? decodeURIComponent(value) : null
    }
    const filename = (decode('x-plaquette-filename') ?? 'plaquette.pdf').replace(/[^A-Za-z0-9._-]/g, '_')
    const pdfPath = `${id}/${filename}`

    const { error: uploadError } = await admin.storage
      .from('plaquettes')
      .upload(pdfPath, pdf, { contentType: 'application/pdf', upsert: true })
    if (uploadError) return NextResponse.json({ ok: false, errors: [`Dépôt du PDF impossible : ${uploadError.message}`] }, { status: 500 })

    const { error } = await admin
      .from('plaquettes')
      .update({
        status: 'prete',
        agent: decode('x-plaquette-agent') ?? 'generique',
        note: decode('x-plaquette-note'),
        ref: decode('x-plaquette-ref'),
        title: decode('x-plaquette-title'),
        pdf_path: pdfPath,
        pdf_filename: filename,
        error: null,
        finished_at: new Date().toISOString(),
      })
      .eq('id', id)
    if (error) return NextResponse.json({ ok: false, errors: [error.message] }, { status: 500 })
    return NextResponse.json({ ok: true, pdfPath })
  }

  return NextResponse.json({ ok: false, errors: ['Action inconnue'] }, { status: 400 })
}
