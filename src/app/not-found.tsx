import Link from 'next/link'
import { SITE } from '@/lib/site'

export const metadata = {
  title: 'Page introuvable',
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-24 sm:py-32">
      <div className="rounded-2xl border border-line bg-card p-8 text-center sm:p-14">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Erreur 404</p>

        <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">Cette page n&apos;existe pas.</h1>

        <p className="mx-auto mt-5 max-w-lg text-[16px] leading-relaxed text-graphite">
          Le lien est peut-être erroné ou la page a été déplacée. Mais vous êtes au bon endroit pour vendre votre
          voiture : voici les deux pages qui vous intéressent.
        </p>

        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/estimation"
            className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-px"
          >
            Estimer ma voiture
          </Link>
          <Link
            href="/reprise"
            className="inline-flex items-center justify-center rounded-full border border-line px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-ink"
          >
            Demander une reprise
          </Link>
        </div>

        <p className="mt-8 text-sm text-muted">
          Ou appelez-nous au{' '}
          <a href={`tel:${SITE.phone.replace(/\s/g, '')}`} className="font-medium text-ink underline underline-offset-4">
            {SITE.phoneDisplay}
          </a>{' '}
          — {SITE.hours.toLowerCase()}.
        </p>
      </div>
    </section>
  )
}
