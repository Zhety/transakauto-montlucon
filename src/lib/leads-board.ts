import type { LeadInput, LeadIntent } from './lead'

export const LEAD_STATUSES = [
  { key: 'a_traiter', label: 'À traiter' },
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
  intent: LeadIntent
  make: string
  model: string
  version: string | null
  year: number
  first_registration: string | null
  mileage_km: number
  fuel: string
  gearbox: string
  plate: string | null
  condition: string
  technical_inspection: string | null
  service_history: boolean | null
  first_hand: boolean | null
  damaged: boolean | null
  ownership: string | null
  expected_price_eur: number | null
  timeframe: string | null
  first_name: string
  last_name: string
  email: string
  phone: string
  postal_code: string
  city: string | null
  message: string | null
  source: string | null
  utm: Record<string, string> | null
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
export function rowToLead(row: LeadRow): LeadInput {
  return {
    intent: row.intent,
    make: row.make,
    model: row.model,
    version: row.version ?? undefined,
    year: row.year,
    firstRegistration: row.first_registration ?? undefined,
    mileageKm: row.mileage_km,
    fuel: row.fuel as LeadInput['fuel'],
    gearbox: row.gearbox as LeadInput['gearbox'],
    plate: row.plate ?? undefined,
    condition: row.condition as LeadInput['condition'],
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
