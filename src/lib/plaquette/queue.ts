/** Types partagés entre le tableau (navigateur) et les routes de la file d'attente des plaquettes. */

export type PlaquetteStatus = 'en_attente' | 'en_cours' | 'prete' | 'erreur'

export const PLAQUETTE_STATUS_LABELS: Record<PlaquetteStatus, string> = {
  en_attente: 'En attente',
  en_cours: 'En cours',
  prete: 'Prête',
  erreur: 'Erreur',
}

export interface PlaquetteRequest {
  id: string
  created_at: string
  status: PlaquetteStatus
  url: string
  /** Frais d'intermédiation saisis avec la demande, en euros (null = montant de la fiche). Nom de colonne historique. */
  road_fees_eur: number | null
  ref: string | null
  title: string | null
  /** 'claude-code' quand le contenu a été rédigé, 'generique' sinon. */
  agent: string | null
  note: string | null
  error: string | null
  pdf_filename: string | null
  /** Lien signé de téléchargement, valable une heure, seulement pour une plaquette prête. */
  download_url: string | null
  requested_by_name: string | null
  started_at: string | null
  finished_at: string | null
}

export interface PlaquetteQueueState {
  requests: PlaquetteRequest[]
  /** Dernier signe de vie du service sur le Mac de l'agence. */
  workerSeenAt: string | null
  error: string | null
}

/** Le service du Mac est considéré connecté s'il a donné signe de vie il y a moins de deux minutes. */
export function workerOnline(seenAt: string | null, now = Date.now()): boolean {
  return seenAt !== null && now - Date.parse(seenAt) < 2 * 60 * 1000
}
