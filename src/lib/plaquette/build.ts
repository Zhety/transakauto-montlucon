import { requireAgency } from './agencies'
import { agentSchema, isClaudeConfigured, runBrochureAgentClaude, type AgentOutput } from './agent'
import { fallbackContent, mergeAgentContent, type BrochureContent } from './content'
import { fetchMytransakBinary, fetchMytransakPage } from './mytransak-auth'
import { parseMandateUrl, scrapeMandate } from './mytransak-scrape'
import { renderBrochurePdf } from './pdf'
import { loadPhotoAssets } from './photos'
import { PlaquetteError, type PhotoAsset, type VehicleDossier } from './types'

export type AgentKind = 'claude' | 'local'

export interface LoadedDossier {
  dossier: VehicleDossier
  assets: PhotoAsset[]
}

export interface BuildResult {
  pdf: Buffer
  filename: string
  dossier: VehicleDossier
  content: BrochureContent
  /** false quand aucun agent n'a rédigé le contenu : plaquette générique. */
  agentUsed: boolean
  /** Qui a rédigé : l'API Claude, un contenu fourni (agent local), ou personne. */
  agent: AgentKind | null
  agentError: string | null
}

export interface BuildOptions {
  /** Désactive l'appel à l'API même si la clé est présente. */
  skipAgent?: boolean
  /** Contenu déjà rédigé (agent local via Claude Code) : aucun appel réseau à un modèle. */
  content?: unknown
  /** Fiche et photos déjà chargées (évite une seconde lecture). */
  loaded?: LoadedDossier
  /** Frais de mise à la route saisis avec la demande : ligne dédiée et prix total sur la plaquette. */
  roadFeesEur?: number | null
  log?: (step: string) => void
}

export function slug(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export function filenameFor(dossier: VehicleDossier): string {
  return `Plaquette_${slug(`${dossier.make}_${dossier.model}`) || 'vehicule'}_${dossier.ref}.pdf`
}

/** Fiche mandat + photos redimensionnées, à partir d'un lien mytransak. */
export async function loadDossier(input: string, log: (step: string) => void = () => {}): Promise<LoadedDossier> {
  const { shop, id } = parseMandateUrl(input)
  requireAgency(shop)

  log('Lecture de la fiche mandat')
  const dossier = await scrapeMandate(shop, id, fetchMytransakPage, input.startsWith('http') ? input : undefined)

  log(`Téléchargement de ${dossier.photos.length} photos`)
  const assets = await loadPhotoAssets(dossier.photos, fetchMytransakBinary)

  return { dossier, assets }
}

/** Valide un contenu rédigé à la main (ou par Claude Code) avant de le mettre en page. */
export function parseLocalContent(content: unknown): AgentOutput {
  const parsed = agentSchema.safeParse(content)
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `${issue.path.join('.') || '(racine)'} : ${issue.message}`)
    throw new PlaquetteError(`Contenu invalide — ${issues.slice(0, 5).join(' · ')}`, 'input')
  }
  return parsed.data
}

/** Lien de fiche mandat → PDF de la plaquette (format « magazine »). */
export async function buildPlaquette(input: string, options: BuildOptions = {}): Promise<BuildResult> {
  const log = options.log ?? (() => {})
  const loaded = options.loaded ?? (await loadDossier(input, log))
  const { assets } = loaded
  const dossier: VehicleDossier = { ...loaded.dossier, roadFeesEur: options.roadFeesEur ?? loaded.dossier.roadFeesEur ?? null }

  let content = fallbackContent(dossier, assets)
  let agent: AgentKind | null = null
  let agentError: string | null = null

  if (options.content !== undefined) {
    log('Mise en forme du contenu rédigé')
    content = mergeAgentContent(dossier, assets, parseLocalContent(options.content))
    agent = 'local'
  } else if (!options.skipAgent && isClaudeConfigured()) {
    log('Rédaction par l’agent (API Claude)')
    try {
      content = mergeAgentContent(dossier, assets, await runBrochureAgentClaude(dossier, assets))
      agent = 'claude'
    } catch (error) {
      agentError = error instanceof Error ? error.message : String(error)
      log(`Agent indisponible, contenu générique (${agentError})`)
    }
  }

  log('Mise en page du PDF')
  const pdf = await renderBrochurePdf(dossier, content, assets)

  return { pdf, filename: filenameFor(dossier), dossier, content, agentUsed: agent !== null, agent, agentError }
}
