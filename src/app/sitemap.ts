import type { MetadataRoute } from 'next'
import { LANDING_PAGES } from '@/lib/landing-pages'
import { absoluteUrl } from '@/lib/seo'

/**
 * Dates fixes plutôt que la date du build : un `lastmod` qui change à chaque
 * déploiement sans que le contenu bouge finit par être ignoré par Google.
 * Mettre la date à jour quand le texte d'une page change.
 */
const CORE_PAGES: Array<{ path: string; updated: string; changeFrequency: 'monthly' | 'yearly'; priority: number }> = [
  { path: '/', updated: '2026-11-09', changeFrequency: 'monthly', priority: 1 },
  { path: '/estimation', updated: '2026-11-09', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/reprise', updated: '2026-11-09', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/mentions-legales', updated: '2026-10-21', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/confidentialite', updated: '2026-10-21', changeFrequency: 'yearly', priority: 0.2 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...CORE_PAGES.map((page) => ({
      url: absoluteUrl(page.path),
      lastModified: page.updated,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
    ...LANDING_PAGES.map((page) => ({
      url: absoluteUrl(`/${page.slug}`),
      lastModified: page.updated,
      changeFrequency: 'monthly' as const,
      priority: page.slug.startsWith('vendre-sa-voiture-') ? 0.7 : 0.8,
    })),
  ]
}
