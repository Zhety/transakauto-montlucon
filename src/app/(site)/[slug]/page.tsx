import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LandingPage } from '@/components/landing-page'
import { LANDING_PAGES, getLandingPage } from '@/lib/landing-pages'
import { pageMetadata } from '@/lib/seo'

/**
 * Pages de référencement (dépôt-vente, crédit / LOA, villes), générées au build
 * depuis src/lib/landing-pages.ts. Toute autre adresse à la racine reste une 404 :
 * les routes déclarées (estimation, reprise…) passent avant ce segment.
 */
export const dynamicParams = false

export function generateStaticParams() {
  return LANDING_PAGES.map((page) => ({ slug: page.slug }))
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = getLandingPage((await params).slug)
  if (!page) return {}
  return pageMetadata({ title: page.metaTitle, description: page.metaDescription, path: `/${page.slug}` })
}

export default async function SeoLandingPage({ params }: Props) {
  const page = getLandingPage((await params).slug)
  if (!page) notFound()
  return <LandingPage page={page} />
}
