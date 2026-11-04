import type { AgentOutput } from './agent'
import type { PhotoAsset, VehicleDossier } from './types'

/** Grille d'extension de garantie du réseau (tarifs indicatifs, en euros). */
export const WARRANTY_TIERS = {
  standard: {
    label: 'Standard',
    criteria: 'Hors 4x4, hors véhicule de plus de 50 000 € neuf, hors puissance fiscale supérieure à 14 CV',
    prices: [
      { months: 6, price: 690 },
      { months: 12, price: 890 },
      { months: 24, price: 1290 },
    ],
  },
  haut_de_gamme: {
    label: 'Haut de gamme',
    criteria: '4x4, véhicule de plus de 50 000 € neuf ou puissance fiscale supérieure à 14 CV',
    prices: [
      { months: 6, price: 990 },
      { months: 12, price: 1290 },
      { months: 24, price: 1890 },
    ],
  },
} as const

export type WarrantyTier = keyof typeof WARRANTY_TIERS

/** Garantie comprise dans les frais d'intermédiation. */
export const INCLUDED_WARRANTY_MONTHS = 3

/** Ce que couvrent les frais d'intermédiation de l'agence (texte de l'annonce). */
export const FEES_DETAIL =
  'courtage, nettoyage, 20 € de carburant, garantie 3 mois moteur / boîte / pont, plateforme de paiement sécurisée par virement'

export const DISCLAIMER =
  "Document non contractuel : des erreurs peuvent se glisser dans ce document, merci de contacter l'agence pour toute précision."

export interface PhotoPick {
  /** Numéro de photo, 1 = première du reportage. */
  photo: number
  title?: string
  caption: string
}

export interface BrochureContent {
  headline: string
  subtitle: string
  intro: string
  featured: PhotoPick[]
  exteriorLead: string
  exterior: PhotoPick[]
  interiorLead: string
  interior: PhotoPick[]
  highlights: { title: string; detail: string }[]
  warranty: { tier: WarrantyTier; reason: string }
  newPriceEstimateEur: number | null
}

export interface SpecRow {
  label: string
  value: string
}

export interface SpecColumn {
  title: string
  rows: SpecRow[]
}

const SKIP_VALUES = new Set(['', '-', '—', 'n/a'])

function find(map: Record<string, string>, pattern: RegExp): string | null {
  for (const [key, value] of Object.entries(map)) {
    if (pattern.test(key) && !SKIP_VALUES.has(value.trim().toLowerCase())) return value.trim()
  }
  return null
}

export function fiscalPower(dossier: VehicleDossier): number | null {
  const raw = find(dossier.registration, /puissance fiscale/i) ?? find(dossier.info, /puissance fiscale/i)
  const match = raw ? /\d+/.exec(raw) : null
  return match ? Number(match[0]) : null
}

export function seats(dossier: VehicleDossier): string | null {
  return find(dossier.registration, /nombre de si[èe]ges/i) ?? find(dossier.info, /places/i)
}

export function firstRegistration(dossier: VehicleDossier): string | null {
  return find(dossier.registration, /mise en circulation/i)
}

export function year(dossier: VehicleDossier): string | null {
  const stat = dossier.stats['Mise en service']
  if (stat && !SKIP_VALUES.has(stat)) return stat
  const date = firstRegistration(dossier)
  const match = date ? /(\d{4})/.exec(date) : null
  return match ? match[1] : null
}

export function mileage(dossier: VehicleDossier): string | null {
  const raw = dossier.stats['Kilométrage']
  if (!raw || SKIP_VALUES.has(raw)) return null
  // « 89,000 km » → « 89 000 km » (espace insécable classique : Poppins n'a pas la fine)
  const digits = raw.replace(/[^\d]/g, '')
  return digits ? `${Number(digits).toLocaleString('fr-FR').replace(/ /g, ' ')} km` : raw
}

export function dinPower(dossier: VehicleDossier): string | null {
  const raw = find(dossier.info, /^puissance din/i)
  const match = raw ? /\d+/.exec(raw) : null
  return match ? `${match[1] ?? match[0]} ch` : null
}

/** Titre commercial : « Citroën Jumpy » (marque + modèle en casse lisible). */
export function defaultHeadline(dossier: VehicleDossier): string {
  const model = dossier.model.length > 3 && dossier.model === dossier.model.toUpperCase()
    ? dossier.model.charAt(0) + dossier.model.slice(1).toLowerCase()
    : dossier.model
  return [dossier.make, model].filter(Boolean).join(' ') || dossier.title
}

export function defaultSubtitle(dossier: VehicleDossier): string {
  const parts = [
    find(dossier.info, /^version$/i),
    find(dossier.info, /^finition$/i) ? `Finition ${find(dossier.info, /^finition$/i)}` : null,
    seats(dossier) ? `${seats(dossier)} places` : null,
    find(dossier.info, /^couleur$/i),
  ].filter(Boolean)
  return parts.join(' · ')
}

export function formatEuro(value: number): string {
  return `${Math.round(value).toLocaleString('fr-FR').replace(/ /g, ' ')} €`
}

const FOUR_WHEEL_DRIVE = /\b(4x4|4wd|awd|xdrive|4matic|quattro|allgrip|4motion|all4|4 ?roues motrices|transmission int[ée]grale|e-four|sh-awd|4control)\b/i

export function looksFourWheelDrive(dossier: VehicleDossier): boolean {
  const haystack = [
    dossier.title,
    ...Object.values(dossier.info),
    ...dossier.savedOptions,
    ...dossier.serie.flatMap((group) => group.items),
    ...dossier.options.flatMap((group) => group.items),
  ].join(' | ')
  return FOUR_WHEEL_DRIVE.test(haystack)
}

/**
 * Grille de garantie applicable, décidée d'après le dossier : puissance
 * fiscale et transmission viennent de la fiche, la valeur neuve de
 * l'estimation de l'agent (absente → on ne peut pas conclure sur ce critère).
 */
export function decideWarranty(dossier: VehicleDossier, agent?: Pick<AgentOutput, 'newPriceEstimateEur' | 'isFourWheelDrive'> | null) {
  const cv = fiscalPower(dossier)
  if (cv !== null && cv > 14) {
    return { tier: 'haut_de_gamme' as const, reason: `puissance fiscale de ${cv} CV` }
  }
  if (looksFourWheelDrive(dossier) || agent?.isFourWheelDrive) {
    return { tier: 'haut_de_gamme' as const, reason: 'transmission 4x4' }
  }
  if (agent?.newPriceEstimateEur != null && agent.newPriceEstimateEur > 50_000) {
    return { tier: 'haut_de_gamme' as const, reason: `valeur neuve estimée à ${formatEuro(agent.newPriceEstimateEur)}` }
  }
  const facts = [
    '2 roues motrices',
    cv !== null ? `${cv} CV fiscaux` : null,
    agent?.newPriceEstimateEur != null ? 'valeur neuve inférieure à 50 000 €' : null,
  ].filter(Boolean)
  return { tier: 'standard' as const, reason: facts.join(', ') }
}

/** Contenu générique quand l'agent n'est pas disponible : photos dans l'ordre du reportage. */
export function fallbackContent(dossier: VehicleDossier, assets: PhotoAsset[]): BrochureContent {
  const n = assets.length
  const pick = (index: number) => Math.min(index, n - 1) + 1
  const seq = (from: number, count: number) =>
    Array.from({ length: Math.min(count, Math.max(0, n - from)) }, (_, i) => ({ photo: pick(from + i), caption: '' }))

  const highlights = [...dossier.options.flatMap((g) => g.items), ...dossier.savedOptions]
    .filter((item, index, list) => list.indexOf(item) === index)
    .slice(0, 8)
    .map((item) => ({ title: item, detail: '' }))

  return {
    headline: defaultHeadline(dossier),
    subtitle: defaultSubtitle(dossier),
    intro: `${defaultHeadline(dossier)} proposé par TransakAuto ${dossier.agency || ''}`.trim() + '.',
    featured: seq(1, 4).map((p) => ({ ...p, title: '' })),
    exteriorLead: '',
    exterior: seq(1, 6),
    interiorLead: '',
    interior: seq(7, 6),
    highlights,
    warranty: decideWarranty(dossier),
    newPriceEstimateEur: null,
  }
}

function validPicks(picks: PhotoPick[], count: number, total: number, used: Set<number>): PhotoPick[] {
  const out: PhotoPick[] = []
  for (const pick of picks) {
    const photo = Math.round(Number(pick.photo))
    if (!Number.isFinite(photo) || photo < 1 || photo > total || used.has(photo)) continue
    used.add(photo)
    out.push({ ...pick, photo, caption: (pick.caption ?? '').trim(), title: pick.title?.trim() })
    if (out.length === count) break
  }
  return out
}

/** Fusionne la proposition de l'agent avec le repli : chaque champ invalide retombe sur le générique. */
export function mergeAgentContent(dossier: VehicleDossier, assets: PhotoAsset[], agent: AgentOutput): BrochureContent {
  const base = fallbackContent(dossier, assets)
  const total = assets.length
  const used = new Set<number>()

  const featured = validPicks(agent.featured ?? [], 4, total, used)
  const exterior = validPicks(agent.exterior ?? [], 6, total, used)
  const interior = validPicks(agent.interior ?? [], 6, total, used)

  const fill = (list: PhotoPick[], count: number, fallback: PhotoPick[]) => {
    for (const candidate of fallback) {
      if (list.length >= count) break
      if (!used.has(candidate.photo)) {
        used.add(candidate.photo)
        list.push(candidate)
      }
    }
    return list
  }

  const highlights = (agent.highlights ?? [])
    .map((h) => ({ title: (h.title ?? '').trim(), detail: (h.detail ?? '').trim() }))
    .filter((h) => h.title)
    .slice(0, 8)

  return {
    headline: agent.headline?.trim() || base.headline,
    subtitle: agent.subtitle?.trim() || base.subtitle,
    intro: agent.intro?.trim() || base.intro,
    featured: fill(featured, 4, base.featured),
    exteriorLead: agent.exteriorLead?.trim() ?? '',
    exterior: fill(exterior, 6, base.exterior),
    interiorLead: agent.interiorLead?.trim() ?? '',
    interior: fill(interior, 6, base.interior),
    highlights: highlights.length ? highlights : base.highlights,
    warranty: decideWarranty(dossier, agent),
    newPriceEstimateEur: agent.newPriceEstimateEur ?? null,
  }
}

/** Les trois colonnes de la fiche technique, uniquement avec des valeurs présentes dans le dossier. */
export function buildSpecs(dossier: VehicleDossier): SpecColumn[] {
  const info = dossier.info
  const reg = dossier.registration
  const row = (label: string, value: string | null | undefined): SpecRow | null =>
    value && !SKIP_VALUES.has(value.trim().toLowerCase()) ? { label, value: value.trim() } : null

  const kw = find(reg, /puissance nette/i)
  const din = dinPower(dossier)
  const power = kw && din ? `${kw} kW / ${din}` : din ?? (kw ? `${kw} kW` : null)
  const euroClass = find(reg, /classe environnement/i)
  const euro = euroClass ? /EURO\s*(\d[a-z-]*)/i.exec(euroClass) : null

  const vehicle = [
    row('Marque / modèle', defaultHeadline(dossier)),
    row('Carrosserie', find(reg, /carrosserie national/i) ?? find(info, /type automobile/i)),
    row('Finition', find(info, /^finition$/i)),
    row('Genre', [find(reg, /genre national/i), find(reg, /cat[ée]gorie ce/i)].filter(Boolean).join(' – ') || null),
    row('Couleur', find(info, /^couleur$/i) ?? find(reg, /^couleur$/i)),
    row('Places assises', seats(dossier)),
    row('Nombre de portes', find(info, /nombre de portes/i)),
    row('Mise en circulation', firstRegistration(dossier)),
    row('Kilométrage', mileage(dossier)),
    row('Origine', find(info, /pays d'origine/i)),
  ]

  const engine = [
    row('Version', find(info, /^version$/i)),
    row('Énergie', dossier.stats['Carburant'] ?? find(reg, /[ée]nergie/i)),
    row('Cylindrée', find(reg, /cylindr[ée]e/i) ? `${find(reg, /cylindr[ée]e/i)} cm³` : null),
    row('Puissance', power),
    row('Puissance fiscale', fiscalPower(dossier) !== null ? `${fiscalPower(dossier)} CV` : null),
    row('Boîte de vitesses', dossier.stats['Boîte']),
    row('Émissions CO₂', find(reg, /co2/i) ? `${find(reg, /co2/i)} g/km` : null),
    row('Norme', euro ? `Euro ${euro[1]}` : null),
  ]

  const admin = [
    row('Poids à vide', find(reg, /PTAV|G\.1\)/) ? `${find(reg, /PTAV|G\.1\)/)} kg` : null),
    row('PTAC', find(reg, /PTAC/) ? `${find(reg, /PTAC/)} kg` : null),
    row('PTRA', find(reg, /PTRA/) ? `${find(reg, /PTRA/)} kg` : null),
    row('Contrôle technique', find(info, /contr[ôo]le technique/i)),
    row('Certificat de non-gage', find(info, /non-gage/i) ? 'Disponible' : null),
    row('Rapport Histovec', find(info, /histovec/i) ? 'Disponible' : null),
  ]

  return [
    { title: 'Véhicule', rows: vehicle.filter((r): r is SpecRow => r !== null) },
    { title: 'Moteur & boîte', rows: engine.filter((r): r is SpecRow => r !== null) },
    { title: 'Poids & administratif', rows: admin.filter((r): r is SpecRow => r !== null) },
  ]
}

export interface EquipmentView {
  options: string[]
  serie: { name: string; items: string[] }[]
}

/** Options en avant, dotation de série par groupe ; sans Autorigin, les options enregistrées font office de dotation. */
export function buildEquipment(dossier: VehicleDossier): EquipmentView {
  const options = dossier.options.flatMap((group) => group.items).filter((item, i, list) => list.indexOf(item) === i)
  const serie = dossier.serie.map((group) => ({ name: group.name, items: group.items }))

  const known = new Set([...options, ...serie.flatMap((g) => g.items)].map((item) => item.toLowerCase()))
  const extra = dossier.savedOptions.filter((item) => !known.has(item.toLowerCase()))
  if (extra.length) {
    // Les options enregistrées absentes d'Autorigin rejoignent le groupe « Autres » (créé au besoin).
    const others = serie.find((group) => /^autres/i.test(group.name))
    if (others) others.items.push(...extra)
    else serie.push({ name: serie.length ? 'Autres équipements' : 'Équipements', items: extra })
  }

  return { options, serie }
}

export interface StatTile {
  value: string
  label: string
}

export function buildStats(dossier: VehicleDossier): StatTile[] {
  const cv = fiscalPower(dossier)
  const tiles: (StatTile | null)[] = [
    year(dossier) ? { value: year(dossier)!, label: 'Année' } : null,
    mileage(dossier) ? { value: mileage(dossier)!.replace(/ km$/, ''), label: 'Kilomètres' } : null,
    dossier.stats['Carburant'] ? { value: dossier.stats['Carburant'], label: 'Énergie' } : null,
    dossier.stats['Boîte'] ? { value: dossier.stats['Boîte'], label: 'Boîte' } : null,
    dinPower(dossier) ? { value: dinPower(dossier)!, label: cv !== null ? `${cv} CV fiscaux` : 'Puissance' } : null,
    seats(dossier) ? { value: seats(dossier)!, label: 'Places' } : null,
  ]
  return tiles.filter((t): t is StatTile => t !== null)
}
