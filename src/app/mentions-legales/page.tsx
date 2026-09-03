import type { Metadata } from 'next'
import { SITE } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: `Mentions légales du site ${SITE.name}.`,
  alternates: { canonical: '/mentions-legales' },
}

export default function MentionsLegalesPage() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 sm:py-20">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Mentions légales</h1>

      <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-graphite">
        <div>
          <h2 className="text-lg font-semibold text-ink">Éditeur du site</h2>
          <p className="mt-2">
            {SITE.legalName}
            <br />
            {SITE.address.street}, {SITE.address.postalCode} {SITE.address.city}, {SITE.address.country}
            <br />
            Téléphone : {SITE.phoneDisplay} — Email : {SITE.email}
            <br />
            {SITE.siret} — {SITE.rcs}
            <br />
            {SITE.vat}
            <br />
            Directeur de la publication : {SITE.director}
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-ink">Activité</h2>
          <p className="mt-2">
            {SITE.legalName} exerce une activité d&apos;intermédiation dans la vente de véhicules d&apos;occasion :
            estimation, mise en relation entre vendeurs et acheteurs, accompagnement de la transaction et des
            démarches administratives associées.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-ink">Hébergement</h2>
          <p className="mt-2">{SITE.hosting}</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-ink">Propriété intellectuelle</h2>
          <p className="mt-2">
            L&apos;ensemble des contenus de ce site (textes, visuels, logos, structure) est protégé par le droit
            d&apos;auteur. Toute reproduction, même partielle, est interdite sans autorisation écrite préalable.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-ink">Responsabilité</h2>
          <p className="mt-2">
            Les estimations communiquées sur ce site ou à la suite d&apos;une demande sont indicatives. Elles reposent
            sur les informations déclarées par le propriétaire du véhicule et sur l&apos;état du marché au moment de la
            demande ; elles ne constituent ni une offre d&apos;achat ferme, ni une garantie de prix de vente.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-ink">Médiation de la consommation</h2>
          <p className="mt-2">
            Conformément à l&apos;article L.612-1 du Code de la consommation, en cas de litige non résolu avec notre
            service client, vous pouvez recourir gratuitement au médiateur de la consommation dont nous relevons.
            Coordonnées à compléter.
          </p>
        </div>
      </div>
    </section>
  )
}
