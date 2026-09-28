import { appendFile } from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'
import { leadSchema, type LeadInput } from '@/lib/lead'
import { leadToRow } from '@/lib/leads-board'
import { sendLeadEmails } from '@/lib/mail'
import { canWriteLeads, createAdminSupabase } from '@/lib/supabase'

export const runtime = 'nodejs'

/**
 * Enregistre la demande pour le tableau des leads. Silencieux si Supabase n'est
 * pas configuré, et ne lève jamais : l'email reste le canal qui compte, une
 * base indisponible ne doit pas faire échouer l'envoi du formulaire.
 */
async function saveLead(lead: LeadInput): Promise<{ saved: boolean; error?: string }> {
  if (!canWriteLeads) return { saved: false, error: 'supabase-not-configured' }

  try {
    const { error } = await createAdminSupabase().from('leads').insert(leadToRow(lead))
    if (error) throw new Error(error.message)
    return { saved: true }
  } catch (error) {
    console.error('[lead] enregistrement en base échoué', error)
    return { saved: false, error: error instanceof Error ? error.message : 'unknown' }
  }
}

/**
 * Filet de sécurité : chaque demande est aussi écrite sur disque, pour qu'un
 * SMTP en panne ne fasse jamais perdre un lead. En lecture seule sur Vercel,
 * l'écriture échoue silencieusement — l'email reste le canal principal.
 */
async function archive(payload: unknown, meta: Record<string, unknown>) {
  try {
    const line = JSON.stringify({ at: new Date().toISOString(), ...meta, payload }) + '\n'
    await appendFile(path.join(process.cwd(), '.leads.jsonl'), line, 'utf8')
  } catch {
    /* système de fichiers non inscriptible : on ignore */
  }
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, errors: ['Requête invalide'] }, { status: 400 })
  }

  const parsed = leadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: parsed.error.issues.map((issue) => issue.message) },
      { status: 422 },
    )
  }

  const lead = parsed.data

  // Robot : on répond « ok » pour ne pas lui indiquer ce qui l'a démasqué.
  if (lead.website) {
    return NextResponse.json({ ok: true })
  }

  // En parallèle : la base ne doit pas retarder l'email, ni l'inverse.
  const [mail, storage] = await Promise.all([sendLeadEmails(lead), saveLead(lead)])
  await archive(lead, {
    emailSent: mail.sent,
    emailError: mail.error,
    leadSaved: storage.saved,
    storageError: storage.error,
  })

  return NextResponse.json({ ok: true })
}
