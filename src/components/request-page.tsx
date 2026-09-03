import Link from 'next/link'
import { LeadForm } from '@/components/lead-form'
import type { LeadIntent } from '@/lib/lead'
import { SITE } from '@/lib/site'

export interface RequestPageProps {
  intent: LeadIntent
  eyebrow: string
  title: string
  intro: string
  /** Ce que le client obtient concrètement — colonne de réassurance. */
  benefits: string[]
  steps: Array<{ title: string; body: string }>
  /** Lien vers l'autre parcours, pour les visiteurs arrivés au mauvais endroit. */
  alternate: { href: string; label: string; hint: string }
}

export function RequestPage({ intent, eyebrow, title, intro, benefits, steps, alternate }: RequestPageProps) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: title,
            description: intro,
            serviceType: intent === 'estimation' ? "Estimation de véhicule d'occasion" : "Reprise de véhicule d'occasion",
            provider: { '@type': 'AutoDealer', name: SITE.name, '@id': `${SITE.url}/#agence` },
            areaServed: SITE.areas.map((area) => ({ '@type': 'Place', name: area })),
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR', availability: 'https://schema.org/InStock' },
          }),
        }}
      />

      <section className="border-b border-line bg-ink text-white">
        <div className="mx-auto max-w-6xl px-5 py-9 sm:py-12">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3.5 py-1.5 text-xs font-medium uppercase tracking-[0.16em] text-white/70">
            <span className="size-1.5 rounded-full bg-accent" />
            {eyebrow}
          </p>
          <h1 className="mt-5 max-w-3xl text-[28px] font-semibold leading-[1.15] tracking-tight sm:text-[40px]">{title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/70">{intro}</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-8 sm:py-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <LeadForm intent={intent} />

            <p className="mt-5 text-sm leading-relaxed text-muted">
              Vos données servent uniquement à traiter votre demande. Elles ne sont ni revendues, ni transmises à des
              tiers. Vous pouvez demander leur suppression à tout moment à{' '}
              <a href={`mailto:${SITE.email}`} className="underline underline-offset-4">
                {SITE.email}
              </a>
              .
            </p>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-line bg-card p-6">
              <h2 className="text-lg font-semibold tracking-tight">Ce que vous obtenez</h2>
              <ul className="mt-4 space-y-3 text-[15px] leading-relaxed text-graphite">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex gap-3">
                    <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-line bg-card p-6">
              <h2 className="text-lg font-semibold tracking-tight">Et ensuite ?</h2>
              <ol className="mt-4 space-y-4">
                {steps.map((step, index) => (
                  <li key={step.title} className="flex gap-3.5">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-semibold text-accent">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="text-[15px] font-medium">{step.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-graphite">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-2xl border border-line bg-accent-soft p-6">
              <h2 className="text-[15px] font-semibold tracking-tight">{alternate.hint}</h2>
              <Link
                href={alternate.href}
                className="mt-3 inline-flex items-center gap-1.5 text-[15px] font-medium text-accent-ink underline underline-offset-4"
              >
                {alternate.label} →
              </Link>
            </div>

            <div className="rounded-2xl border border-line bg-card p-6">
              <h2 className="text-[15px] font-semibold tracking-tight">Vous préférez en parler ?</h2>
              <a
                href={`tel:${SITE.phone.replace(/\s/g, '')}`}
                className="mt-2 block text-xl font-semibold tracking-tight"
              >
                {SITE.phoneDisplay}
              </a>
              <p className="mt-1.5 text-sm text-muted">{SITE.hours}</p>
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}
