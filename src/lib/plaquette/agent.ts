import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
// L'aide zod du SDK attend zod v4 ; le reste du site reste sur l'API v3.
import { z } from 'zod/v4'
import { PlaquetteError, type PhotoAsset, type VehicleDossier } from './types'

/**
 * L'agent rédactionnel : il regarde toutes les photos du reportage et les
 * données du mandat, puis choisit les photos à mettre en avant, écrit les
 * légendes et les points forts, et estime la valeur neuve (critère de la
 * grille de garantie). Tout ce qu'il renvoie est revalidé dans content.ts.
 */
export const AGENT_MODEL = process.env.PLAQUETTE_MODEL ?? 'claude-opus-5-5'

const pickSchema = z.object({
  photo: z.number().describe('Numéro de la photo (1 = première du reportage)'),
  title: z.string().describe('Titre court du point fort illustré (4 mots max)'),
  caption: z.string().describe('Légende courte, factuelle'),
})

const captionSchema = z.object({
  photo: z.number(),
  caption: z.string(),
})

export const agentSchema = z.object({
  headline: z.string().describe('Nom commercial du véhicule : marque + modèle + carrosserie, ex. « Citroën Jumpy Cabine Approfondie »'),
  subtitle: z.string().describe('Motorisation · finition · places · couleur, séparés par « · »'),
  intro: z.string().describe('Une ou deux phrases qui résument l’intérêt du véhicule'),
  featured: z.array(pickSchema).describe('Exactement 4 photos qui illustrent les atouts (équipements, options, détails valorisants)'),
  exteriorLead: z.string().describe('Une phrase d’introduction de la page Extérieur'),
  exterior: z.array(captionSchema).describe('Exactement 6 photos d’extérieur, sans la photo 1'),
  interiorLead: z.string().describe('Une phrase d’introduction de la page Intérieur'),
  interior: z.array(captionSchema).describe('Exactement 6 photos d’intérieur, poste de conduite, sièges ou chargement'),
  highlights: z
    .array(z.object({ title: z.string(), detail: z.string() }))
    .describe('Exactement 8 points forts : titre (5 mots max) et précision courte'),
  newPriceEstimateEur: z
    .number()
    .nullable()
    .describe('Estimation du prix catalogue TTC du véhicule neuf avec ses options, en euros, ou null si impossible'),
  isFourWheelDrive: z.boolean().describe('true si le véhicule a 4 roues motrices'),
})

export type AgentOutput = z.infer<typeof agentSchema>

export function isClaudeConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

export const SYSTEM = `Tu es le rédacteur commercial d'une agence TransakAuto (courtage automobile entre particuliers, France).
Tu prépares le contenu d'une plaquette PDF envoyée à des acheteurs potentiels pour un véhicule d'occasion.

Règles strictes :
- Tu écris en français, ton sobre et professionnel, sans superlatifs creux ni points d'exclamation.
- Tu n'affirmes que ce qui figure dans les données du mandat ou qui est clairement visible sur les photos. Aucun équipement inventé, aucune performance ou capacité calculée.
- Les photos sont numérotées : la photo 1 est toujours la couverture, ne la choisis jamais ailleurs. Une photo ne sert qu'une fois.
- Pour « featured » : 4 photos qui montrent un atout concret (écran, caméra, boîte, sellerie, attelage, jantes, affichage tête haute, etc.). Évite les gros plans de défauts, de rayures ou de pneus.
- Pour « exterior » : 6 vues de carrosserie variées (avant, profil, arrière, 3/4). Pour « interior » : 6 vues d'habitacle, sièges, tableau de bord, espace de chargement.
- Les légendes font moins de 70 caractères et décrivent ce que montre la photo.
- Les 8 points forts reprennent les options et équipements du dossier et ce que confirment les photos ; détail de 60 caractères max.
- newPriceEstimateEur : ton estimation du prix catalogue TTC en France du véhicule neuf dans cette version avec ses options, à l'année de mise en circulation. Donne null seulement si tu ne sais vraiment pas.
- isFourWheelDrive d'après la version et les équipements (traction avant ou propulsion → false).`

/** Les champs de la carte grise qui n'ont rien à faire dans une plaquette ni dans un prompt. */
const PRIVATE_KEYS = /titulaire|VIN|immatriculation|formule|CNIT|variante|r[ée]ception/i

export function dossierForPrompt(dossier: VehicleDossier) {
  const registration = Object.fromEntries(Object.entries(dossier.registration).filter(([key]) => !PRIVATE_KEYS.test(key)))
  return {
    titre: dossier.title,
    marque: dossier.make,
    modele: dossier.model,
    prixVenteEur: dossier.priceEur,
    informations: dossier.info,
    stats: dossier.stats,
    carteGrise: registration,
    optionsEnregistrees: dossier.savedOptions,
    dotationSerie: dossier.serie,
    options: dossier.options,
    nombrePhotos: dossier.photos.length,
  }
}

export async function runBrochureAgentClaude(dossier: VehicleDossier, assets: PhotoAsset[]): Promise<AgentOutput> {
  if (!isClaudeConfigured()) throw new PlaquetteError('ANTHROPIC_API_KEY manquante', 'config')

  const client = new Anthropic({ timeout: 180_000, maxRetries: 1 })

  const content: Anthropic.ContentBlockParam[] = [
    {
      type: 'text',
      text: `Données du mandat (JSON) :\n${JSON.stringify(dossierForPrompt(dossier), null, 1)}\n\nVoici les ${assets.length} photos du reportage, dans l'ordre.`,
    },
  ]
  for (const asset of assets) {
    content.push({ type: 'text', text: `Photo ${asset.position + 1}` })
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: 'image/jpeg', data: asset.thumb.toString('base64') },
    })
  }
  content.push({ type: 'text', text: 'Rédige maintenant le contenu de la plaquette au format demandé.' })

  const response = await client.messages.parse({
    model: AGENT_MODEL,
    max_tokens: 8000,
    system: SYSTEM,
    messages: [{ role: 'user', content }],
    output_config: { format: zodOutputFormat(agentSchema) },
  })

  if (response.stop_reason === 'refusal') {
    throw new PlaquetteError("L'agent a refusé de rédiger ce contenu", 'upstream')
  }
  if (!response.parsed_output) {
    throw new PlaquetteError("Réponse de l'agent illisible", 'upstream')
  }
  return response.parsed_output
}
