import type { Metadata } from 'next'
import Link from 'next/link'
import { ConversionTracker } from '@/components/conversion-tracker'
import { INTENT_LABELS, type LeadIntent } from '@/lib/lead'
import { SITE } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Demande envoyée',
  // Page de conversion : elle ne doit pas remonter dans les résultats de recherche.
  robots: { index: false, follow: false },
}

export default async function MerciPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams
  const intent: LeadIntent = type === 'reprise' ? 'reprise' : 'estimation'

  return (
    <section className="mx-auto max-w-3xl px-5 py-20 sm:py-28">
      <ConversionTracker intent={intent} />
      <div className="rounded-2xl border border-line bg-card p-8 text-center sm:p-14">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-accent-soft text-2xl text-accent-ink">
          ✓
        </div>

        <h1 className="mt-7 text-3xl font-semibold tracking-tight sm:text-4xl">Votre demande est bien partie.</h1>

        <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-graphite">
          Nous avons reçu votre {INTENT_LABELS[intent].toLowerCase()}. Un conseiller {SITE.name} étudie votre véhicule
          et vous recontacte <strong className="font-semibold text-ink">sous 24h ouvrées</strong>, par téléphone ou par
          email. Un accusé de réception vient de vous être envoyé — pensez à vérifier vos indésirables.
        </p>

        <div className="mt-9 rounded-xl border border-line bg-paper px-6 py-5 text-left">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">Pour aller plus vite</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-graphite">
            Envoyez-nous quelques photos de votre véhicule (extérieur, intérieur, compteur et carte grise) à{' '}
            <a href={`mailto:${SITE.email}`} className="font-medium underline underline-offset-4">
              {SITE.email}
            </a>{' '}
            : l&apos;estimation sera plus précise, et plus rapide.
          </p>
        </div>

        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href={`tel:${SITE.phone.replace(/\s/g, '')}`}
            className="inline-flex items-center justify-center rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-px"
          >
            Nous appeler — {SITE.phoneDisplay}
          </a>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-line px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-ink"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </section>
  )
}
