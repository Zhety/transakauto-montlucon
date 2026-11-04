/** Une photo du mandat telle que listée dans l'onglet Photos de mytransak. */
export interface MandatePhoto {
  id: string
  /** Ordre du reportage : la première photo (0) est toujours la couverture. */
  position: number
  fullUrl: string
  thumbUrl: string
}

/** Groupe d'équipements (ex. « Aide à la conduite ») avec ses libellés. */
export interface EquipmentGroup {
  key: string
  name: string
  items: string[]
}

/** Tout ce que la plaquette tire de la fiche mandat (onglets Informations, Photos, Équipements). */
export interface VehicleDossier {
  shop: string
  mandateId: string
  sourceUrl: string
  ref: string
  title: string
  make: string
  model: string
  agency: string
  commercial: string | null
  priceEur: number | null
  feesEur: number | null
  /** Frais de mise à la route saisis avec la demande (facultatif) : ligne dédiée, ajoutés au prix total. */
  roadFeesEur: number | null
  /** « Informations du véhicule » : Version, Finition, Couleur, Puissance DIN… */
  info: Record<string, string>
  /** Bandeau de stats : Mise en service, Carburant, Kilométrage, Boîte. */
  stats: Record<string, string>
  /** « Résumé de la carte grise », clés telles qu'affichées (« Puissance fiscale (P.6) »). */
  registration: Record<string, string>
  photos: MandatePhoto[]
  /** Options enregistrées sur le mandat (celles de l'annonce publique). */
  savedOptions: string[]
  /** Dotation de série d'après Autorigin, par groupe. */
  serie: EquipmentGroup[]
  /** Options d'après Autorigin, par groupe. */
  options: EquipmentGroup[]
  listingUrl: string | null
}

/** Photo téléchargée et redimensionnée, prête à être embarquée dans le PDF. */
export interface PhotoAsset {
  id: string
  position: number
  /** ~1 100 px de large : pages photos. */
  large: Buffer
  /** ~360 px de large : galerie complète et analyse par l'agent. */
  thumb: Buffer
  /** ~1 500 px de large, seulement pour la première photo (couverture pleine page). */
  hero?: Buffer
  /** Dimensions de `large` : la couverture adapte sa hauteur pour ne jamais recadrer en largeur. */
  width?: number
  height?: number
}

export type PlaquetteErrorKind = 'config' | 'auth' | 'input' | 'notfound' | 'upstream'

export class PlaquetteError extends Error {
  constructor(
    message: string,
    public readonly kind: PlaquetteErrorKind,
  ) {
    super(message)
    this.name = 'PlaquetteError'
  }
}
