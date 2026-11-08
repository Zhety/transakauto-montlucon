import Link from 'next/link'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { ContentSections } from '@/components/content-sections'
import { CtaBanner } from '@/components/cta-banner'
import { FaqList } from '@/components/faq-list'
import { JsonLd } from '@/components/json-ld'
import { RelatedLinks } from '@/components/related-links'
import type { LandingPageContent } from '@/lib/landing-pages'
import { AGENCY_ID, MAPS_URL, absoluteUrl, breadcrumbJsonLd, faqJsonLd } from '@/lib/seo'
import { SITE } from '@/lib/site'

const tel = `tel:${SITE.phone.replace(/\s/g, '')}`

/** Gabarit des pages de référencement : bandeau, texte, FAQ, contact, pages voisines. */
export function LandingPage({ page }: { page: LandingPageContent }) {
  const path = `/${page.slug}`
  const crumbs = [
    { name: 'Accueil', path: '/' },
    { name: page.label, path },
  ]

  return (
    <>
      <JsonLd
        data={{
          '@graph': [
            {
              '@type': 'Service',
              '@id': `${absoluteUrl(path)}#service`,
              name: page.title,
              description: page.intro,
              serviceType: page.serviceType,
              url: absoluteUrl(path),
              provider: { '@type': 'AutoDealer', '@id': AGENCY_ID, name: SITE.name },
              areaServed: (page.places ?? SITE.areas).map((name) => ({ '@type': 'Place', name })),
            },
            breadcrumbJsonLd(crumbs),
            faqJsonLd(page.faq, path),
          ],
        }}
      />

      <section className="relative overflow-hidden bg-ink text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-40 size-[480px] rounded-full bg-accent/15 blur-3xl"
        />
        <div className="relative mx-auto max-w-6xl px-5 py-12 sm:py-16">
          <Breadcrumbs crumbs={crumbs} />
          <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 px-3.5 py-1.5 text-xs font-medium uppercase tracking-[0.16em] text-white/70">
            <span className="size-1.5 rounded-full bg-accent" />
            {page.eyebrow}
          </p>
          <h1 className="mt-5 max-w-3xl text-[30px] font-semibold leading-[1.12] tracking-tight sm:text-5xl">{page.title}</h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">{page.intro}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/estimation"
              className="inline-flex items-center justify-center rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-white transition-transform hover:-translate-y-px"
            >
              Estimer ma voiture gratuitement
            </Link>
            <Link
              href="/reprise"
              className="inline-flex items-center justify-center rounded-full border border-white/25 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:border-white"
            >
              Demander une reprise
            </Link>
          </div>
          <p className="mt-5 text-sm text-white/50">
            Réponse sous 24h ouvrées · Sans engagement · Ou appelez-nous au{' '}
            <a href={tel} className="text-white underline underline-offset-4">
              {SITE.phoneDisplay}
            </a>
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px]">
          <article className="min-w-0">
            <ContentSections sections={page.sections} />

            <section id="faq" className="mt-16 scroll-mt-24">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Questions fréquentes</h2>
              <FaqList items={page.faq} />
            </section>
          </article>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-line bg-card p-6">
              <h2 className="text-lg font-semibold tracking-tight">Estimation gratuite</h2>
              <p className="mt-2 text-sm leading-relaxed text-graphite">
                Décrivez votre voiture en deux minutes : nous vous répondons sous 24h ouvrées, sans engagement.
              </p>
              <Link
                href="/estimation"
                className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-px"
              >
                Estimer ma voiture
              </Link>
            </div>

            <div className="rounded-2xl border border-line bg-card p-6">
              <h2 className="text-[15px] font-semibold tracking-tight">{SITE.name}</h2>
              <a href={tel} className="mt-2 block text-xl font-semibold tracking-tight">
                {SITE.phoneDisplay}
              </a>
              <p className="mt-3 text-sm leading-relaxed text-graphite">
                {SITE.address.street}
                <br />
                {SITE.address.postalCode} {SITE.address.city}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-graphite">{SITE.hours}</p>
              <a
                href={MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex text-sm font-medium text-accent-ink underline underline-offset-4"
              >
                Itinéraire vers l&apos;agence
              </a>
            </div>
          </aside>
        </div>

        <div className="mt-20">
          <RelatedLinks paths={page.related} />
        </div>
      </div>

      <CtaBanner />
    </>
  )
}
