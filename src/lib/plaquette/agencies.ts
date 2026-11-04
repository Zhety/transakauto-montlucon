import { PlaquetteError } from './types'

/**
 * Agences du réseau connues du générateur. La plaquette porte l'identité de
 * l'agence qui détient le mandat (boutique mytransak du lien), jamais celle
 * du site d'où la demande est faite : un mandat de Clermont demandé depuis le
 * tableau de Montluçon sort avec les coordonnées de Clermont. Une boutique
 * absente d'ici est refusée plutôt que d'imprimer de mauvaises coordonnées.
 */
export interface Agency {
  /** Boutique mytransak : segment `shop-…` du lien de la fiche mandat. */
  shop: string
  name: string
  legalName: string
  phoneDisplay: string
  email: string
  address: { street: string; postalCode: string; city: string }
  hours: string
  rcs: string
}

export const AGENCIES: readonly Agency[] = [
  {
    shop: 'shop-montlucon-201',
    name: 'Transakauto Montluçon',
    legalName: 'TFM AUTO (SAS)',
    phoneDisplay: '06 14 90 25 48',
    email: 'montlucon@transakauto.com',
    address: { street: '56 rue Eugène Sue', postalCode: '03100', city: 'Montluçon' },
    hours: 'Du mardi au vendredi, 10h - 18h30 · Samedi, 10h - 17h',
    rcs: 'RCS Montluçon 939 743 308',
  },
  {
    shop: 'shop-clermont-ferrand-sud-79',
    name: 'Transakauto Clermont-Fd',
    legalName: 'AP AUTOMOBILE (SAS)',
    phoneDisplay: '06 76 42 76 03',
    email: 'clermont-ferrandsud@transakauto.com',
    address: { street: '8 Avenue Jean Curabet', postalCode: '63170', city: 'Aubière' },
    hours: 'Du lundi au samedi, 10h - 19h',
    rcs: 'RCS Clermont-Fd 930 899 000',
  },
]

export function agencyForShop(shop: string): Agency | null {
  return AGENCIES.find((agency) => agency.shop === shop) ?? null
}

/** Même chose, mais refuse une boutique inconnue avec un message qui dit quoi faire. */
export function requireAgency(shop: string): Agency {
  const agency = agencyForShop(shop)
  if (!agency) {
    throw new PlaquetteError(
      `Boutique mytransak inconnue (${shop}) : ajoutez cette agence dans src/lib/plaquette/agencies.ts avant de générer sa plaquette.`,
      'input',
    )
  }
  return agency
}
