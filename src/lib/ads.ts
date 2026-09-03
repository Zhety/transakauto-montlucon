/**
 * Compte Google Ads du site (`AW-xxxxxxxxx`). Propre à l'agence : le compte de
 * Metz ne doit pas être réutilisé ici, sans quoi les conversions des deux sites
 * se mélangeraient. Tant qu'il est vide, aucune balise n'est chargée et aucun
 * cookie publicitaire n'est déposé — le bandeau cookies ne s'affiche pas.
 */
export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? ''

/**
 * Libellé de l'action de conversion « Demande envoyée », fourni par Google
 * avec l'extrait d'événement (`send_to: AW-xxxx/LIBELLE`). Tant qu'il est vide,
 * la balise est chargée mais aucune conversion n'est déclarée — le site
 * fonctionne, on ne remonte simplement rien à Google Ads.
 */
export const CONVERSION_LABEL = process.env.NEXT_PUBLIC_ADS_CONVERSION_LABEL ?? ''

/** Valeur attribuée à un lead, alignée sur la configuration Google Ads. */
export const CONVERSION_VALUE = 25

export const CONSENT_STORAGE_KEY = 'tam-consent'
