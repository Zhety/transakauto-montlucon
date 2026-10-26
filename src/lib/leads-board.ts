import type { LeadInput, LeadIntent, LeadLike } from './lead'

export const LEAD_STATUSES = [
  { key: 'a_traiter', label: 'À traiter' },
  { key: 'a_rappeler', label: 'À rappeler' },
  { key: 'ne_repond_pas', label: 'Ne répond pas' },
  { key: 'non_rdv', label: 'Non RDV' },
  { key: 'oui_rdv', label: 'Oui RDV' },
] as const

export type LeadStatus = (typeof LEAD_STATUSES)[number]['key']

export const LEAD_STATUS_KEYS = LEAD_STATUSES.map((status) => status.key)

export const MEMBER_ROLES = [
  { key: 'admin', label: 'Administrateur', help: 'Gère les leads et les utilisateurs' },
  { key: 'commercial', label: 'Commercial', help: 'Gère les leads' },
] as const

export type MemberRole = (typeof MEMBER_ROLES)[number]['key']

export interface Member {
  id: string
  first_name: string
  last_name: string | null
  role: MemberRole
  /** Renseigné uniquement sur la page Utilisateurs, via l'API d'administration. */
  email?: string
}

export function memberName(member: Member): string {
  return [member.first_name, member.last_name].filter(Boolean).join(' ')
}

/** Ligne de la table `leads` : colonnes en snake_case, comme en base. */
export interface LeadRow {
  id: string
  created_at: string
  status: LeadStatus
  assigned_to: string | null
  /** Date de rappel convenue avec le vendeur, null si aucune (migration 005). */
  callback_at: string | null
  intent: LeadIntent
  make: string | null
  model: string | null
  version: string | null
  year: number | null
  first_registration: string | null
  mileage_km: number | null
  fuel: string | null
  gearbox: string | null
  plate: string | null
  condition: string | null
  technical_inspection: string | null
  service_history: boolean | null
  first_hand: boolean | null
  damaged: boolean | null
  ownership: string | null
  expected_price_eur: number | null
  timeframe: string | null
  first_name: string
  last_name: string | null
  email: string
  phone: string | null
  postal_code: string | null
  city: string | null
  message: string | null
  source: string | null
  utm: Record<string, string> | null
  meta_lead_id: string | null
}

/** Ligne de la table `lead_notes` : une note du journal des appels (migration 005). */
export interface LeadNote {
  id: string
  lead_id: string
  /** Null si le compte de l'auteur a été supprimé. */
  author_id: string | null
  body: string
  created_at: string
}

/** Passe d'une demande validée à la ligne à insérer. */
export function leadToRow(lead: LeadInput) {
  return {
    intent: lead.intent,
    make: lead.make,
    model: lead.model,
    version: lead.version ?? null,
    year: lead.year,
    first_registration: lead.firstRegistration ?? null,
    mileage_km: lead.mileageKm,
    fuel: lead.fuel,
    gearbox: lead.gearbox,
    plate: lead.plate ?? null,
    condition: lead.condition,
    technical_inspection: lead.technicalInspection ?? null,
    service_history: lead.serviceHistory ?? null,
    first_hand: lead.firstHand ?? null,
    damaged: lead.damaged ?? null,
    ownership: lead.ownership ?? null,
    expected_price_eur: lead.expectedPriceEur ?? null,
    timeframe: lead.timeframe ?? null,
    first_name: lead.firstName,
    last_name: lead.lastName,
    email: lead.email,
    phone: lead.phone,
    postal_code: lead.postalCode,
    city: lead.city ?? null,
    message: lead.message ?? null,
    source: lead.source ?? null,
    utm: lead.utm ?? null,
  }
}

/**
 * Chemin inverse : le tableau réutilise `leadRows()`, le même récapitulatif que
 * les emails, pour qu'une demande s'affiche partout de façon identique.
 */
export function rowToLead(row: LeadRow): LeadLike {
  return {
    intent: row.intent,
    make: row.make,
    model: row.model,
    version: row.version ?? undefined,
    year: row.year,
    firstRegistration: row.first_registration ?? undefined,
    mileageKm: row.mileage_km,
    fuel: row.fuel,
    gearbox: row.gearbox,
    plate: row.plate ?? undefined,
    condition: row.condition,
    technicalInspection: (row.technical_inspection ?? undefined) as LeadInput['technicalInspection'],
    serviceHistory: row.service_history ?? undefined,
    firstHand: row.first_hand ?? undefined,
    damaged: row.damaged ?? undefined,
    ownership: (row.ownership ?? undefined) as LeadInput['ownership'],
    expectedPriceEur: row.expected_price_eur ?? undefined,
    timeframe: (row.timeframe ?? undefined) as LeadInput['timeframe'],
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    postalCode: row.postal_code,
    city: row.city ?? undefined,
    message: row.message ?? undefined,
    source: row.source ?? undefined,
    utm: row.utm ?? undefined,
    consent: true,
  }
}

/**
 * D'où vient la demande. Les leads Meta arrivent par la passerelle et portent
 * `meta_lead_id` ; ceux du site portent les paramètres de campagne captés dans
 * l'URL, d'où la lecture de `utm`.
 */
export type LeadOrigin = 'meta' | 'google' | 'site'

export const ORIGIN_LABELS: Record<LeadOrigin, string> = {
  meta: 'Meta',
  google: 'Google Ads',
  site: 'Site',
}

export function leadOrigin(row: Pick<LeadRow, 'meta_lead_id' | 'source' | 'utm'>): LeadOrigin {
  if (row.meta_lead_id) return 'meta'

  const utm = row.utm ?? {}
  const source = `${utm.utm_source ?? ''} ${row.source ?? ''}`.toLowerCase()

  if (utm.fbclid || /facebook|instagram|meta|fb|ig/.test(source)) return 'meta'
  if (utm.gclid || /google|adwords/.test(source)) return 'google'
  return 'site'
}
