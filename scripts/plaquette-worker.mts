/**
 * Service « plaquettes » du Mac de l'agence.
 *
 * Interroge le site (leads.transakautomontlucon.com) toutes les quelques
 * secondes : dès qu'une demande de plaquette attend, il lit la fiche mytransak,
 * prépare le dossier de travail, fait rédiger le contenu par Claude Code
 * (abonnement, pas de clé API), met en page le PDF et le dépose sur le site.
 *
 *   npm run plaquette:worker                  service permanent (installé par scripts/install-worker.sh)
 *   npm run plaquette:worker -- --une-fois <lien mytransak> [--frais 300]   un seul traitement, PDF écrit en local, sans le site
 *
 * .env.local : MYTRANSAK_EMAIL, MYTRANSAK_PASSWORD, PLAQUETTE_WORKER_TOKEN,
 * PLAQUETTE_SITE_URL (défaut : https://leads.transakautomontlucon.com),
 * CLAUDE_BIN (facultatif), PLAQUETTE_CLAUDE_MODEL (facultatif).
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { buildPlaquette, filenameFor, loadDossier, slug, type AgentKind, type LoadedDossier } from '../src/lib/plaquette/build'
import { writeContentWithClaudeCode } from '../src/lib/plaquette/claude-code'
import { PlaquetteError } from '../src/lib/plaquette/types'
import { prepareWorkDir } from '../src/lib/plaquette/workdir'

const VERSION = '1.0.0'
const SITE = (process.env.PLAQUETTE_SITE_URL ?? 'https://leads.transakautomontlucon.com').replace(/\/$/, '')
const TOKEN = process.env.PLAQUETTE_WORKER_TOKEN ?? ''
const POLL_MS = Number(process.env.PLAQUETTE_POLL_MS ?? 15_000)
const WORK_ROOT = path.resolve('plaquettes')

const stamp = () => new Date().toISOString().slice(11, 19)
const log = (message: string) => console.log(`${stamp()} ${message}`)

interface Produced {
  pdf: Buffer
  filename: string
  ref: string
  title: string
  agent: AgentKind | 'generique'
  note: string | null
}

/** Fiche → dossier de travail → Claude Code → PDF. Repli générique si Claude Code échoue. */
async function produce(url: string, requestId: string, feesEur: number | null = null): Promise<Produced> {
  const loaded: LoadedDossier = await loadDossier(url, log)
  const { dossier, assets } = loaded
  const dir = path.join(WORK_ROOT, `${slug(dossier.ref)}-${requestId.slice(0, 8)}`)
  log(`Dossier de travail : ${dir}`)
  const work = await prepareWorkDir(dir, loaded)

  let content: unknown
  let agent: AgentKind | 'generique' = 'generique'
  let note: string | null = null
  try {
    const run = await writeContentWithClaudeCode(work, { log })
    content = run.content
    agent = 'local'
    await fs.writeFile(path.join(dir, 'contenu.json'), JSON.stringify(run.content, null, 2))
    log(`Contenu rédigé par Claude Code (${run.turns ?? '?'} tours)`)
  } catch (error) {
    note = error instanceof Error ? error.message : String(error)
    log(`Claude Code indisponible, version générique : ${note}`)
  }

  const result = await buildPlaquette(url, { loaded, content, skipAgent: true, log, feesEur })
  await fs.writeFile(path.join(dir, result.filename), result.pdf)
  return {
    pdf: result.pdf,
    filename: filenameFor(dossier),
    ref: dossier.ref,
    title: `${dossier.make} ${dossier.model}`.trim() || dossier.title,
    agent: agent === 'local' ? 'local' : 'generique',
    note,
  }
}

async function api(action: string, init: RequestInit & { id?: string } = {}): Promise<Record<string, unknown>> {
  const url = new URL('/api/board/plaquette/worker', SITE)
  url.searchParams.set('action', action)
  if (init.id) url.searchParams.set('id', init.id)
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'x-plaquette-worker-version': VERSION,
      ...(init.headers ?? {}),
    },
    // Pas de suivi des redirections : un renvoi vers la page de connexion doit
    // ressortir comme une erreur, pas comme une file vide.
    redirect: 'manual',
    signal: AbortSignal.timeout(60_000),
  })
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>
  if (!response.ok || data.ok !== true) {
    const detail = Object.keys(data).length
      ? JSON.stringify(data).slice(0, 200)
      : 'réponse inattendue (le site a renvoyé une page, pas du JSON)'
    throw new Error(`${action} → ${response.status} ${detail}`)
  }
  return data
}

interface QueuedRequest {
  id: string
  url: string
  /** Frais d'intermédiation saisis avec la demande (remplacent ceux de la fiche). */
  road_fees_eur?: number | null
}

async function handle(request: QueuedRequest) {
  const feesEur = request.road_fees_eur ?? null
  log(`Demande ${request.id.slice(0, 8)} : ${request.url}${feesEur !== null ? ` · frais d'intermédiation ${feesEur} €` : ''}`)
  try {
    const produced = await produce(request.url, request.id, feesEur)
    await api('done', {
      id: request.id,
      method: 'POST',
      body: new Uint8Array(produced.pdf),
      headers: {
        'Content-Type': 'application/pdf',
        'x-plaquette-filename': encodeURIComponent(produced.filename),
        'x-plaquette-agent': produced.agent === 'local' ? 'claude-code' : 'generique',
        'x-plaquette-ref': encodeURIComponent(produced.ref),
        'x-plaquette-title': encodeURIComponent(produced.title),
        ...(produced.note ? { 'x-plaquette-note': encodeURIComponent(produced.note.slice(0, 500)) } : {}),
      },
    })
    log(`Demande ${request.id.slice(0, 8)} : PDF déposé (${(produced.pdf.length / 1024 / 1024).toFixed(1)} Mo, ${produced.agent})`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log(`Demande ${request.id.slice(0, 8)} en erreur : ${message}`)
    try {
      await api('fail', { id: request.id, method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: message }) })
    } catch (failError) {
      log(`Impossible de signaler l'erreur au site : ${failError instanceof Error ? failError.message : failError}`)
    }
  }
}

async function loop() {
  if (!TOKEN) {
    console.error('PLAQUETTE_WORKER_TOKEN manquant dans .env.local')
    process.exit(1)
  }
  log(`Service plaquettes ${VERSION} démarré · site ${SITE} · toutes les ${POLL_MS / 1000}s`)
  let idleTicks = 0
  let failedTicks = 0
  for (;;) {
    try {
      const data = await api('claim')
      const request = data.request as QueuedRequest | null
      if (failedTicks) log('Site de nouveau joignable')
      failedTicks = 0
      if (request) {
        idleTicks = 0
        await handle(request)
        continue // une autre demande attend peut-être
      }
      if (++idleTicks % 40 === 1) log('En veille, aucune demande')
    } catch (error) {
      // Première erreur tout de suite, puis une ligne toutes les dix minutes environ.
      if (++failedTicks % 40 === 1) log(`Site injoignable : ${error instanceof Error ? error.message : error}`)
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_MS))
  }
}

const args = process.argv.slice(2)
const once = args.indexOf('--une-fois')
if (once >= 0) {
  const url = args[once + 1]
  if (!url) {
    console.error('Usage : npm run plaquette:worker -- --une-fois <lien mytransak> [--frais <montant>]')
    process.exit(1)
  }
  try {
    const feeIndex = args.indexOf('--frais')
    const feesEur = feeIndex >= 0 ? Number(String(args[feeIndex + 1] ?? '').replace(/\D/g, '')) || null : null
    const produced = await produce(url, `local-${Date.now()}`, feesEur)
    log(`PDF : plaquettes/… /${produced.filename} (${produced.agent}${produced.note ? ` — ${produced.note}` : ''})`)
  } catch (error) {
    console.error(error instanceof PlaquetteError ? `${error.kind} : ${error.message}` : error)
    process.exit(2)
  }
} else {
  await loop()
}
