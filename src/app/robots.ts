import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/site'

/**
 * Tant que les coordonnées de l'agence sont des placeholders, on empêche
 * Google d'indexer le site : `NEXT_PUBLIC_NOINDEX=true` dans l'environnement.
 * À retirer le jour où les vraies informations sont en place.
 */
const noindex = process.env.NEXT_PUBLIC_NOINDEX === 'true'

export default function robots(): MetadataRoute.Robots {
  if (noindex) {
    return { rules: { userAgent: '*', disallow: '/' } }
  }

  return {
    rules: { userAgent: '*', allow: '/', disallow: '/merci' },
    sitemap: `${SITE.url}/sitemap.xml`,
  }
}
