import type { Metadata } from 'next'
import { SITE } from '@/lib/site'

/** Identifiant de la fiche établissement (données structurées de l'accueil), cité par les autres pages. */
export const AGENCY_ID = `${SITE.url}/#agence`

export interface FaqItem {
  q: string
  a: string
}

export interface Crumb {
  name: string
  path: string
}

/**
 * Balises d'une page publique : titre complet (sans gabarit), description,
 * URL canonique et aperçus de partage. Next remplace l'objet `openGraph` du
 * parent en entier : type, langue et nom du site sont donc répétés ici.
 */
export function pageMetadata({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      locale: 'fr_FR',
      siteName: SITE.name,
      title,
      description,
      url: path,
      images: ['/opengraph-image'],
    },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export function absoluteUrl(path: string): string {
  return path === '/' ? SITE.url : `${SITE.url}${path}`
}

export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  }
}

export function faqJsonLd(items: readonly FaqItem[], path: string) {
  return {
    '@type': 'FAQPage',
    '@id': `${absoluteUrl(path)}#faq`,
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }
}

/** Lien d'itinéraire Google Maps vers l'agence. */
export const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${SITE.name}, ${SITE.address.street}, ${SITE.address.postalCode} ${SITE.address.city}`,
)}`
