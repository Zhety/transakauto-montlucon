import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE } from '@/lib/site'

export const metadata: Metadata = {
  title: { absolute: "Vendre sa voiture à Montluçon et dans l'Allier | Transakauto" },
  description:
    "Estimation gratuite sous 24h, annonce, visites et paiement sécurisé : nous vendons votre voiture à votre place. Montluçon, Allier, Cher et Creuse.",
  alternates: { canonical: '/' },
  openGraph: { title: "Vendre sa voiture à Montluçon et dans l'Allier | Transakauto", description: "Estimation gratuite sous 24h, annonce, visites et paiement sécurisé : nous vendons votre voiture à votre place. Montluçon, Allier, Cher et Creuse.", url: '/', images: ['/opengraph-image'] },
  twitter: { title: "Vendre sa voiture à Montluçon et dans l'Allier | Transakauto", description: "Estimation gratuite sous 24h, annonce, visites et paiement sécurisé : nous vendons votre voiture à votre place. Montluçon, Allier, Cher et Creuse." },
}

const STATS = [
  { value: '24h', label: 'Réponse à votre demande' },
  { value: '0 €', label: "Frais tant que le véhicule n'est pas vendu" },
  { value: '22 j', label: 'Délai de vente moyen' },
  { value: '03 · 18 · 23', label: 'Allier, Cher et Creuse' },
]

const PROCESS = [
  {
    title: 'Vous décrivez votre véhicule',
    body: "Marque, modèle, année, kilométrage, état : deux minutes suffisent, en ligne et sans engagement.",
  },
  {
    title: 'Nous estimons sa valeur réelle',
    body: "Nous croisons les cotes du marché et les ventes réelles de la région pour fixer un prix atteignable, pas un prix de vitrine.",
  },
  {
    title: 'Nous vendons à votre place',
    body: "Photos, annonce diffusée sur les grandes plateformes, appels filtrés, visites et essais : nous gérons tout, vous gardez votre voiture.",
  },
  {
    title: 'Vous êtes payé, en sécurité',
    body: "Vérification de l'acheteur, paiement contrôlé, carte grise, certificat de non-gage et procès-verbal de livraison : le dossier est complet.",
  },
]

const REASONS = [
  {
    title: 'Le prix du particulier, le service du pro',
    body: "Une reprise en concession vous coûte souvent plusieurs milliers d'euros. Nous visons le prix du marché entre particuliers, sans que vous ayez à gérer la vente.",
  },
  {
    title: 'Zéro rendez-vous fantôme',
    body: "Nous filtrons les curieux, les négociateurs agressifs et les arnaques. Vous ne rencontrez que des acheteurs sérieux et solvables.",
  },
  {
    title: 'Aucun risque de paiement',
    body: "Chèque de banque falsifié, virement annulé, faux acheteur : nous vérifions les fonds avant de vous remettre les clés.",
  },
  {
    title: 'Administratif pris en charge',
    body: "Déclaration de cession, code de cession, certificat de situation administrative : tout est fait dans les règles et dans les délais.",
  },
  {
    title: 'Vous restez propriétaire',
    body: "Contrairement à un dépôt-vente classique, votre voiture reste chez vous et vous continuez à l'utiliser jusqu'à la vente.",
  },
  {
    title: 'Une reprise immédiate si vous êtes pressé',
    body: "Besoin de vendre vite ? Nous vous faisons une proposition de rachat ferme, avec paiement rapide.",
  },
]

const COMPARISON = [
  ['Fixer le bon prix', 'Au feeling, souvent trop haut ou trop bas', 'Étude de marché locale et cote réelle'],
  ['Annonce et photos', 'À votre charge, sur une seule plateforme', 'Reportage photo et diffusion multi-plateformes'],
  ['Appels et visites', 'Jour et nuit, y compris les curieux', 'Filtrés et gérés par votre conseiller'],
  ['Essais du véhicule', 'Avec un inconnu, sans garantie', 'Acheteur vérifié, accompagnement assuré'],
  ['Sécurité du paiement', 'Risque de fraude à votre charge', 'Fonds contrôlés avant remise des clés'],
  ['Démarches administratives', 'À vous de tout faire', 'Dossier complet réalisé par nos soins'],
]

const FAQ = [
  {
    q: "Combien coûte le service ?",
    a: "L'estimation est gratuite et sans engagement. Notre rémunération est une commission fixée en accord avec le vendeur, prélevée uniquement le jour de la vente. Si votre véhicule n'est pas vendu, vous ne payez rien.",
  },
  {
    q: "Quelle est la différence entre une estimation et une reprise ?",
    a: "L'estimation vous donne la valeur de vente de votre véhicule sur le marché : c'est le point de départ d'une vente accompagnée. La reprise est une offre de rachat ferme, plus rapide, avec un paiement à la clé — le montant est en général un peu inférieur au prix d'une vente à particulier.",
  },
  {
    q: "Combien de temps prend la vente ?",
    a: "22 jours en moyenne pour un véhicule correctement positionné. En cas de reprise, la transaction peut être bouclée en quelques jours.",
  },
  {
    q: "Puis-je vendre un véhicule encore sous crédit ou en LOA ?",
    a: "Oui, et c'est une de nos spécialités : nous gérons parfaitement les véhicules en crédit, LOA ou leasing. Nous calculons le solde restant dû avec votre organisme de financement et l'intégrons à la transaction — vous encaissez la différence.",
  },
  {
    q: "Quels documents dois-je prévoir ?",
    a: "La carte grise à votre nom, votre pièce d'identité, le dernier contrôle technique de moins de six mois, le carnet d'entretien et les doubles des clés. Nous nous chargeons du certificat de situation administrative.",
  },
  {
    q: "Mon véhicule est ancien ou a beaucoup de kilomètres, est-ce un problème ?",
    a: "Non. Nous traitons tous les véhicules en état de rouler, du petit citadin au véhicule haut de gamme, y compris ceux à fort kilométrage. Le prix est simplement ajusté en conséquence. En revanche, nous ne reprenons pas les véhicules en panne ou immobilisés.",
  },
]

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-40 size-[560px] rounded-full bg-accent/15 blur-3xl"
        />
        <div className="relative mx-auto max-w-6xl px-5 py-20 sm:py-28">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3.5 py-1.5 text-xs font-medium uppercase tracking-[0.16em] text-white/70">
            <span className="size-1.5 rounded-full bg-accent" />
            Agence d&apos;intermédiation automobile · Montluçon
          </p>

          <h1 className="mt-7 max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">
            Vendez votre voiture au <span className="text-accent">meilleur prix</span>, sans en gérer une seule étape.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
            Nous estimons votre véhicule, le mettons en vente, filtrons les acheteurs et sécurisons le paiement. Vous
            gardez votre voiture jusqu&apos;au dernier jour, et vous encaissez le prix d&apos;une vente entre
            particuliers.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
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
            <a href={`tel:${SITE.phone.replace(/\s/g, '')}`} className="text-white underline underline-offset-4">
              {SITE.phoneDisplay}
            </a>
          </p>
        </div>

        <div className="relative border-t border-white/10">
          <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-5 sm:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="py-7 sm:py-8">
                <dt className="text-2xl font-semibold text-accent sm:text-3xl">{stat.value}</dt>
                <dd className="mt-1.5 text-sm text-white/60">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20 sm:py-24">
        <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Deux façons de vendre, une seule exigence : le meilleur prix pour vous.
        </h2>

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <article className="flex flex-col rounded-2xl border border-line bg-card p-7 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-ink">Le plus demandé</span>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight">Estimation et vente accompagnée</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-graphite">
              Vous voulez savoir ce que vaut réellement votre véhicule et le vendre au prix du marché. Nous établissons
              une estimation détaillée, puis nous prenons la vente en charge de A à Z.
            </p>
            <ul className="mt-6 space-y-2.5 text-[15px] text-graphite">
              {[
                'Estimation gratuite sous 24h',
                'Reportage photo et annonce professionnelle',
                'Diffusion sur les grandes plateformes',
                'Visites, essais et négociation gérés',
                'Commission uniquement en cas de vente',
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/estimation"
              className="mt-8 inline-flex w-fit items-center justify-center rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-px"
            >
              Demander mon estimation
            </Link>
          </article>

          <article className="flex flex-col rounded-2xl border border-line bg-card p-7 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Le plus rapide</span>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight">Reprise et rachat de votre véhicule</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-graphite">
              Vous avez besoin de vendre vite, de financer un autre véhicule ou de solder un crédit. Nous vous faisons
              une proposition de reprise ferme, sans attendre de trouver un acheteur.
            </p>
            <ul className="mt-6 space-y-2.5 text-[15px] text-graphite">
              {[
                'Proposition de rachat sous 24h',
                'Toutes marques, tout kilométrage, véhicule en état de rouler',
                'Crédit, LOA ou leasing en cours pris en charge',
                'Paiement rapide et sécurisé',
                'Démarches administratives incluses',
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-ink/25" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/reprise"
              className="mt-8 inline-flex w-fit items-center justify-center rounded-full border border-ink px-6 py-3 text-sm font-semibold text-ink transition-transform hover:-translate-y-px"
            >
              Demander une reprise
            </Link>
          </article>
        </div>
      </section>

      {/* Process */}
      <section id="process" className="scroll-mt-20 border-y border-line bg-card">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:py-24">
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Comment ça marche
          </h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-graphite">
            Quatre étapes, et une seule chose à faire de votre côté : nous décrire votre véhicule.
          </p>

          <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS.map((item, index) => (
              <li key={item.title}>
                <div className="flex size-10 items-center justify-center rounded-full bg-ink text-sm font-semibold text-accent">
                  {index + 1}
                </div>
                <h3 className="mt-5 text-lg font-semibold tracking-tight">{item.title}</h3>
                <p className="mt-2.5 text-[15px] leading-relaxed text-graphite">{item.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Pourquoi nous */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:py-24">
        <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Pourquoi passer par {SITE.name}
        </h2>

        <div className="mt-12 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {REASONS.map((reason) => (
            <article key={reason.title}>
              <h3 className="text-lg font-semibold tracking-tight">{reason.title}</h3>
              <p className="mt-2.5 text-[15px] leading-relaxed text-graphite">{reason.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Comparatif */}
      <section className="border-y border-line bg-card">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:py-24">
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Vendre seul, ou nous laisser faire
          </h2>

          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line text-sm uppercase tracking-[0.12em] text-muted">
                  <th scope="col" className="py-4 pr-6 font-medium">Étape</th>
                  <th scope="col" className="py-4 pr-6 font-medium">Vente entre particuliers</th>
                  <th scope="col" className="py-4 font-medium text-ink">Avec {SITE.name}</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map(([step, alone, withUs]) => (
                  <tr key={step} className="border-b border-line/70 align-top">
                    <th scope="row" className="py-4 pr-6 text-[15px] font-medium">{step}</th>
                    <td className="py-4 pr-6 text-[15px] text-muted">{alone}</td>
                    <td className="py-4 text-[15px] font-medium text-ink">{withUs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Zone */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:py-24">
        <div className="rounded-2xl border border-line bg-card p-8 sm:p-12">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Une agence locale, de Montluçon à Guéret</h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-graphite">
            Nous connaissons le marché bourbonnais : ce qui se vend vite, ce qui se négocie, et à quel prix. Nous
            intervenons à {SITE.areas.slice(0, -1).join(', ')} et dans {SITE.areas.at(-1)}.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {SITE.areas.map((area) => (
              <span key={area} className="rounded-full border border-line px-4 py-1.5 text-sm text-graphite">
                {area}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-5 pb-20 sm:pb-24">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Questions fréquentes</h2>

        <div className="mt-10 divide-y divide-line border-y border-line">
          {FAQ.map((item) => (
            <details key={item.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-[17px] font-medium">
                {item.q}
                <span
                  aria-hidden
                  className="mt-1 shrink-0 text-muted transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-[15px] leading-relaxed text-graphite">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-6xl px-5 pb-4">
        <div className="rounded-2xl bg-ink px-7 py-14 text-center text-white sm:px-12">
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Combien vaut votre voiture aujourd&apos;hui ?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/70">
            Deux minutes pour remplir le formulaire, une réponse sous 24h ouvrées. Gratuit, et sans aucun
            engagement de votre part.
          </p>
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

      {/* Données structurées : fiche établissement + FAQ dépliable dans Google. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'AutoDealer',
                '@id': `${SITE.url}/#agence`,
                name: SITE.name,
                legalName: SITE.legalName,
                url: SITE.url,
                telephone: SITE.phone,
                email: SITE.email,
                image: `${SITE.url}/opengraph-image`,
                priceRange: 'Commission au succès',
                description:
                  "Agence d'intermédiation automobile : estimation, vente accompagnée et reprise de véhicules d'occasion à Montluçon, Saint-Amand-Montrond, Guéret et dans l'Allier.",
                address: {
                  '@type': 'PostalAddress',
                  streetAddress: SITE.address.street,
                  postalCode: SITE.address.postalCode,
                  addressLocality: SITE.address.city,
                  addressRegion: 'Auvergne-Rhône-Alpes',
                  addressCountry: 'FR',
                },
                openingHoursSpecification: [
                  {
                    '@type': 'OpeningHoursSpecification',
                    dayOfWeek: ['Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                    opens: '10:00',
                    closes: '18:30',
                  },
                  {
                    '@type': 'OpeningHoursSpecification',
                    dayOfWeek: ['Saturday'],
                    opens: '10:00',
                    closes: '17:00',
                  },
                ],
                areaServed: SITE.areas.map((area) => ({ '@type': 'Place', name: area })),
                makesOffer: [
                  {
                    '@type': 'Offer',
                    name: "Estimation gratuite d'un véhicule d'occasion",
                    url: `${SITE.url}/estimation`,
                    price: '0',
                    priceCurrency: 'EUR',
                  },
                  {
                    '@type': 'Offer',
                    name: "Reprise et rachat d'un véhicule d'occasion",
                    url: `${SITE.url}/reprise`,
                  },
                ],
              },
              {
                '@type': 'FAQPage',
                '@id': `${SITE.url}/#faq`,
                mainEntity: FAQ.map((item) => ({
                  '@type': 'Question',
                  name: item.q,
                  acceptedAnswer: { '@type': 'Answer', text: item.a },
                })),
              },
            ],
          }),
        }}
      />
    </>
  )
}
