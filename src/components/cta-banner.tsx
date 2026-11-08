import Link from 'next/link'

/** Bandeau d'appel à l'action de fin de page. */
export function CtaBanner({
  title = "Combien vaut votre voiture aujourd'hui ?",
  text = 'Deux minutes pour remplir le formulaire, une réponse sous 24h ouvrées. Gratuit, et sans aucun engagement de votre part.',
}: {
  title?: string
  text?: string
}) {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-4">
      <div className="rounded-2xl bg-ink px-7 py-14 text-center text-white sm:px-12">
        <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/70">{text}</p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/estimation"
            className="inline-flex items-center justify-center rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-white transition-transform hover:-translate-y-px"
          >
            Estimer ma voiture
          </Link>
          <Link
            href="/reprise"
            className="inline-flex items-center justify-center rounded-full border border-white/25 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:border-white"
          >
            Demander une reprise
          </Link>
        </div>
      </div>
    </section>
  )
}
