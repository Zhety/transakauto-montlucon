import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { z } from 'zod/v4'
import { SYSTEM, agentSchema, type AgentOutput } from './agent'
import { PlaquetteError } from './types'
import type { WorkDir } from './workdir'

/**
 * L'agent rédacteur « local » : Claude Code lancé en mode automatique sur le
 * Mac de l'agence (`claude -p`), couvert par l'abonnement — aucune clé API.
 * Il lit dossier.json et les planches-contact du dossier de travail, puis
 * renvoie le contenu au format de `agentSchema` (sortie structurée).
 */

/** Trie des versions du type 2.1.317 : la plus récente en premier. */
function byVersionDesc(a: string, b: string): number {
  const va = a.match(/\d+(\.\d+)*/)?.[0].split('.').map(Number) ?? []
  const vb = b.match(/\d+(\.\d+)*/)?.[0].split('.').map(Number) ?? []
  for (let i = 0; i < Math.max(va.length, vb.length); i++) {
    const diff = (vb[i] ?? 0) - (va[i] ?? 0)
    if (diff !== 0) return diff
  }
  return 0
}

/** Binaire Claude Code : CLAUDE_BIN, puis le CLI installé, puis celui embarqué par l'extension VS Code. */
export function findClaudeBinary(): string {
  const candidates: string[] = []
  if (process.env.CLAUDE_BIN) candidates.push(process.env.CLAUDE_BIN)
  candidates.push(path.join(os.homedir(), '.local', 'bin', 'claude'), '/opt/homebrew/bin/claude', '/usr/local/bin/claude')

  const extensions = path.join(os.homedir(), '.vscode', 'extensions')
  try {
    const folders = fs
      .readdirSync(extensions)
      .filter((name) => name.startsWith('anthropic.claude-code-'))
      .sort(byVersionDesc)
    for (const folder of folders) candidates.push(path.join(extensions, folder, 'resources', 'native-binary', 'claude'))
  } catch {
    // Pas d'extension VS Code : on s'en tient aux autres candidats.
  }

  const found = candidates.find((candidate) => fs.existsSync(candidate))
  if (!found) {
    throw new PlaquetteError(
      'Claude Code introuvable sur ce Mac : installez le CLI (claude.ai/install.sh) ou définissez CLAUDE_BIN',
      'config',
    )
  }
  return found
}

function promptFor(work: WorkDir): string {
  const sheets = work.sheetPaths.map((file) => path.basename(file)).join(', ')
  return `Tu prépares le contenu de la plaquette PDF du véhicule décrit dans ce dossier de travail.

1. Lis le fichier dossier.json (fiche mandat, carte grise, options, dotation de série, nombre de photos).
2. Regarde chaque planche-contact : ${sheets}. Les photos y sont numérotées (5 par ligne) ; ce numéro est la valeur à mettre dans les champs "photo" (1 = première photo du reportage). En cas de doute sur une photo, ouvre photos/NN.jpg.
3. Rédige le contenu demandé :
   - headline : marque + modèle + carrosserie en casse lisible (ex. « Citroën Jumpy Cabine Approfondie »).
   - subtitle : motorisation · finition · places · couleur, séparés par « · ».
   - intro : une ou deux phrases sobres sur l'intérêt du véhicule.
   - featured : exactement 4 photos qui montrent un atout concret (écran, caméra, boîte, sellerie, attelage, jantes, affichage tête haute…), avec title (4 mots max) et caption (moins de 70 caractères).
   - exteriorLead puis exterior : une phrase, puis exactement 6 vues de carrosserie variées avec caption.
   - interiorLead puis interior : une phrase, puis exactement 6 vues d'habitacle, sièges, tableau de bord ou chargement avec caption.
   - highlights : exactement 8 points forts { title, detail } tirés des options, de la dotation et de ce que confirment les photos.
   - newPriceEstimateEur : ton estimation du prix catalogue TTC du véhicule neuf dans cette version avec ses options, à l'année de mise en circulation, ou null si tu ne sais vraiment pas.
   - isFourWheelDrive : true seulement si le véhicule a 4 roues motrices.

Règles : français sobre, sans superlatifs ni points d'exclamation ; rien qui ne figure dans le dossier ou qui ne soit visible sur les photos ; aucune donnée calculée ; la photo 1 est toujours la couverture, ne la choisis jamais ailleurs ; une photo ne sert qu'une fois ; pas de gros plans de défauts, de rayures ni de pneus dans featured.

Réponds uniquement avec le JSON demandé, sans texte autour.`
}

interface ClaudeResult {
  type?: string
  subtype?: string
  is_error?: boolean
  result?: string
  structured_output?: unknown
  total_cost_usd?: number
  num_turns?: number
}

export interface LocalAgentRun {
  content: AgentOutput
  binary: string
  costUsd: number | null
  turns: number | null
}

export interface LocalAgentOptions {
  model?: string
  timeoutMs?: number
  log?: (step: string) => void
}

/** Lance Claude Code sur le dossier de travail et renvoie le contenu validé. */
export async function writeContentWithClaudeCode(work: WorkDir, options: LocalAgentOptions = {}): Promise<LocalAgentRun> {
  const binary = findClaudeBinary()
  const log = options.log ?? (() => {})
  const model = options.model ?? process.env.PLAQUETTE_CLAUDE_MODEL
  const timeoutMs = options.timeoutMs ?? 15 * 60 * 1000

  const schema = z.toJSONSchema(agentSchema) as Record<string, unknown>
  delete schema.$schema

  const args = [
    '-p',
    promptFor(work),
    '--output-format',
    'json',
    '--json-schema',
    JSON.stringify(schema),
    '--allowedTools',
    'Read',
    '--max-turns',
    '25',
    '--append-system-prompt',
    SYSTEM,
  ]
  if (model) args.push('--model', model)

  // Un Claude Code lancé depuis Claude Code refuse de démarrer : on efface ses marqueurs.
  const env = { ...process.env }
  delete env.CLAUDECODE
  delete env.CLAUDE_CODE_ENTRYPOINT

  log(`Rédaction par Claude Code (${path.basename(path.dirname(path.dirname(path.dirname(binary))))})`)
  const raw = await new Promise<string>((resolve, reject) => {
    const child = spawn(binary, args, { cwd: work.dir, env, stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      reject(new PlaquetteError(`Claude Code n'a pas répondu en ${Math.round(timeoutMs / 60000)} min`, 'upstream'))
    }, timeoutMs)
    child.stdout.on('data', (chunk: Buffer) => (stdout += chunk.toString()))
    child.stderr.on('data', (chunk: Buffer) => (stderr += chunk.toString()))
    child.on('error', (error) => {
      clearTimeout(timer)
      reject(new PlaquetteError(`Impossible de lancer Claude Code : ${error.message}`, 'config'))
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      if (code !== 0 && !stdout.trim()) {
        reject(new PlaquetteError(`Claude Code s'est arrêté (code ${code}) : ${stderr.trim().slice(0, 300)}`, 'upstream'))
      } else resolve(stdout)
    })
  })

  let parsed: ClaudeResult
  try {
    parsed = JSON.parse(raw) as ClaudeResult
  } catch {
    throw new PlaquetteError(`Réponse de Claude Code illisible : ${raw.slice(0, 200)}`, 'upstream')
  }
  if (parsed.is_error) {
    throw new PlaquetteError(`Claude Code a signalé une erreur : ${String(parsed.result ?? parsed.subtype ?? '').slice(0, 300)}`, 'upstream')
  }

  let candidate: unknown = parsed.structured_output
  if (candidate === undefined && typeof parsed.result === 'string') {
    const text = parsed.result.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '')
    try {
      candidate = JSON.parse(text)
    } catch {
      throw new PlaquetteError(`Claude Code n'a pas renvoyé de JSON : ${parsed.result.slice(0, 200)}`, 'upstream')
    }
  }

  const validated = agentSchema.safeParse(candidate)
  if (!validated.success) {
    const issues = validated.error.issues.map((issue) => `${issue.path.join('.') || '(racine)'} : ${issue.message}`)
    throw new PlaquetteError(`Contenu de Claude Code invalide — ${issues.slice(0, 4).join(' · ')}`, 'upstream')
  }

  return {
    content: validated.data,
    binary,
    costUsd: typeof parsed.total_cost_usd === 'number' ? parsed.total_cost_usd : null,
    turns: typeof parsed.num_turns === 'number' ? parsed.num_turns : null,
  }
}
