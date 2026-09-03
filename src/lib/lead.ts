import { z } from 'zod'

export type LeadIntent = 'estimation' | 'reprise'

export const INTENT_LABELS: Record<LeadIntent, string> = {
  estimation: "Demande d'estimation",
  reprise: 'Demande de reprise',
}

/** Mobile ou fixe français, tolérant sur les séparateurs et le préfixe +33. */
const PHONE_RE = /^(?:(?:\+|00)33[\s.-]?(?:\(0\)[\s.-]?)?|0)[1-9](?:[\s.-]?\d{2}){4}$/

const CURRENT_YEAR = new Date().getFullYear()

export const FUELS = ['Essence', 'Diesel', 'Hybride', 'Hybride rechargeable', 'Électrique', 'GPL'] as const
export const GEARBOXES = ['Manuelle', 'Automatique'] as const
export const CONDITIONS = [
  { value: 'excellent', label: 'Excellent — comme neuf' },
  { value: 'bon', label: 'Bon — usure normale' },
  { value: 'moyen', label: 'Moyen — rayures, petits défauts' },
  { value: 'a-reparer', label: 'À réparer — travaux à prévoir' },
] as const
export const TECHNICAL_INSPECTIONS = [
  { value: 'valide', label: 'Valide (plus de 6 mois)' },
  { value: 'bientot', label: 'À refaire bientôt (moins de 6 mois)' },
  { value: 'a-faire', label: 'À faire / expiré' },
  { value: 'contre-visite', label: 'Contre-visite en cours' },
  { value: 'non-concerne', label: 'Non concerné (véhicule de moins de 4 ans)' },
] as const
export const TIMEFRAMES = [
  { value: 'immediat', label: 'Dès que possible' },
  { value: '1-mois', label: "D'ici un mois" },
  { value: '3-mois', label: "D'ici trois mois" },
  { value: 'je-me-renseigne', label: 'Je me renseigne' },
] as const
export const OWNERSHIPS = [
  { value: 'proprietaire', label: 'Le véhicule est payé' },
  { value: 'credit', label: 'Crédit en cours' },
  { value: 'loa-lld', label: 'LOA / LLD en cours' },
] as const

export const leadSchema = z.object({
  intent: z.enum(['estimation', 'reprise']),

  // Véhicule
  make: z.string().trim().min(1, 'Marque requise').max(40),
  model: z.string().trim().min(1, 'Modèle requis').max(60),
  version: z.string().trim().max(80).optional(),
  year: z.coerce
    .number({ invalid_type_error: 'Année invalide' })
    .int()
    .min(1950, 'Année invalide')
    .max(CURRENT_YEAR + 1, 'Année invalide'),
  firstRegistration: z.string().trim().max(20).optional(),
  mileageKm: z.coerce
    .number({ invalid_type_error: 'Kilométrage invalide' })
    .int()
    .min(0)
    .max(1_500_000, 'Kilométrage invalide'),
  fuel: z.enum(FUELS),
  gearbox: z.enum(GEARBOXES),
  plate: z.string().trim().max(12).optional(),

  // État et historique
  condition: z.enum(['excellent', 'bon', 'moyen', 'a-reparer']),
  technicalInspection: z.enum(['valide', 'bientot', 'a-faire', 'contre-visite', 'non-concerne']).optional(),
  serviceHistory: z.boolean().optional(),
  firstHand: z.boolean().optional(),
  damaged: z.boolean().optional(),
  ownership: z.enum(['proprietaire', 'credit', 'loa-lld']).optional(),
  expectedPriceEur: z.coerce.number().int().min(0).max(1_000_000).optional(),
  timeframe: z.enum(['immediat', '1-mois', '3-mois', 'je-me-renseigne']).optional(),

  // Coordonnées
  firstName: z.string().trim().min(2, 'Prénom trop court').max(60),
  lastName: z.string().trim().min(2, 'Nom trop court').max(60),
  email: z.string().trim().email('Email invalide').max(160),
  phone: z.string().trim().regex(PHONE_RE, 'Numéro de téléphone français invalide'),
  postalCode: z.string().trim().regex(/^\d{5}$/, 'Code postal à 5 chiffres'),
  city: z.string().trim().max(80).optional(),
  message: z.string().trim().max(2000).optional(),

  consent: z.literal(true, { errorMap: () => ({ message: 'Merci de cocher la case de consentement' }) }),

  // Suivi (Google / Meta Ads)
  source: z.string().trim().max(200).optional(),
  utm: z.record(z.string().max(200)).optional(),

  /**
   * Champ leurre : seuls les robots le remplissent. Accepté par le schéma pour
   * que la route puisse écarter la demande sans signaler ce qui l'a trahie.
   */
  website: z.string().max(500).optional(),
})

export type LeadInput = z.infer<typeof leadSchema>

const labelOf = <T extends { value: string; label: string }>(list: readonly T[], value?: string) =>
  list.find((item) => item.value === value)?.label

const yesNo = (value?: boolean) => (value === undefined ? '—' : value ? 'Oui' : 'Non')

/** Lignes du récapitulatif, partagées par l'email interne et l'accusé de réception. */
export function leadRows(lead: LeadInput): Array<[string, string]> {
  const km = `${lead.mileageKm.toLocaleString('fr-FR')} km`
  const price =
    lead.expectedPriceEur === undefined
      ? '—'
      : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(
          lead.expectedPriceEur,
        )

  return [
    ['Type de demande', INTENT_LABELS[lead.intent]],
    ['Véhicule', [lead.make, lead.model, lead.version].filter(Boolean).join(' ')],
    ['Année', String(lead.year)],
    ['1re mise en circulation', lead.firstRegistration || '—'],
    ['Kilométrage', km],
    ['Énergie / boîte', `${lead.fuel} · ${lead.gearbox}`],
    ['Immatriculation', lead.plate || '—'],
    ['État général', labelOf(CONDITIONS, lead.condition) ?? '—'],
    ['Contrôle technique', labelOf(TECHNICAL_INSPECTIONS, lead.technicalInspection) ?? '—'],
    ['Carnet d’entretien', yesNo(lead.serviceHistory)],
    ['Première main', yesNo(lead.firstHand)],
    ['Véhicule accidenté', yesNo(lead.damaged)],
    ['Situation', labelOf(OWNERSHIPS, lead.ownership) ?? '—'],
    ['Prix espéré', price],
    ['Échéance', labelOf(TIMEFRAMES, lead.timeframe) ?? '—'],
    ['Nom', `${lead.firstName} ${lead.lastName}`],
    ['Email', lead.email],
    ['Téléphone', lead.phone],
    ['Localisation', `${lead.postalCode} ${lead.city ?? ''}`.trim()],
    ['Message', lead.message || '—'],
    ['Page d’origine', lead.source || '—'],
    ['Campagne', lead.utm && Object.keys(lead.utm).length
      ? Object.entries(lead.utm).map(([k, v]) => `${k}=${v}`).join(' · ')
      : '—'],
  ]
}
