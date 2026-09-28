import type { Metadata } from 'next'
import { SITE } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: `Comment ${SITE.name} collecte et utilise vos données personnelles.`,
  alternates: { canonical: '/confidentialite' },
}

export default function ConfidentialitePage() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 sm:py-20">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Politique de confidentialité</h1>
      <p className="mt-4 text-sm text-muted">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>

      <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-graphite">
        <div>
          <h2 className="text-lg font-semibold text-ink">Responsable du traitement</h2>
          <p className="mt-2">
            {SITE.legalName}, {SITE.address.street}, {SITE.address.postalCode} {SITE.address.city}. Contact :{' '}
            <a href={`mailto:${SITE.email}`} className="underline underline-offset-4">
              {SITE.email}
            </a>
            .
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-ink">Données collectées</h2>
          <p className="mt-2">
            Via les formulaires d&apos;estimation et de reprise : votre identité (prénom, nom), vos coordonnées (email,
            téléphone, code postal, ville), les caractéristiques de votre véhicule (marque, modèle, année,
            kilométrage, énergie, boîte, état, immatriculation si vous la renseignez) et votre message éventuel.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-ink">Finalités et base légale</h2>
          <p className="mt-2">
            Ces données servent exclusivement à traiter votre demande, vous recontacter et, le cas échéant, mener à
            bien la vente ou la reprise de votre véhicule. Le traitement repose sur votre consentement, recueilli lors
            de l&apos;envoi du formulaire, et sur l&apos;exécution de mesures précontractuelles prises à votre demande.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-ink">Destinataires</h2>
          <p className="mt-2">
            Vos données sont traitées par {SITE.legalName} et son prestataire d&apos;envoi d&apos;emails. Elles ne sont
            ni vendues, ni louées, ni cédées à des tiers à des fins commerciales.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-ink">Durée de conservation</h2>
          <p className="mt-2">
            Trois ans à compter du dernier contact, sauf obligation légale de conservation plus longue liée à une
            transaction réalisée.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-ink">Vos droits</h2>
          <p className="mt-2">
            Vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, de limitation, de
            portabilité et d&apos;opposition. Exercez-les à{' '}
            <a href={`mailto:${SITE.email}`} className="underline underline-offset-4">
              {SITE.email}
            </a>
            . En cas de désaccord persistant, vous pouvez saisir la CNIL (
            <a href="https://www.cnil.fr" className="underline underline-offset-4" rel="noopener">
              cnil.fr
            </a>
            ).
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-ink">Cookies et mesure d&apos;audience</h2>
          <p className="mt-2">
            Aucun cookie de mesure ou de publicité n&apos;est déposé avant votre accord : à votre première visite, un
            bandeau vous permet d&apos;accepter ou de refuser. Tant que vous n&apos;avez pas accepté, la balise Google
            Ads fonctionne en mode restreint et ne dépose rien sur votre appareil.
          </p>
          <p className="mt-2">
            Si vous acceptez, des cookies Google Ads mesurent quelles annonces amènent des demandes. Vous pouvez
            revenir sur votre choix à tout moment en effaçant les données de site de votre navigateur. Par ailleurs,
            les paramètres de campagne présents dans l&apos;URL (utm, gclid, fbclid) sont transmis avec votre demande
            pour identifier l&apos;origine du contact.
          </p>
          <p className="mt-2">
            Toujours avec votre accord, le suivi avancé des conversions de Google transmet une empreinte
            cryptographique (SHA-256) de votre email, de votre téléphone et de votre nom, calculée dans votre
            navigateur : ces informations ne quittent jamais votre appareil en clair et servent uniquement à
            rattacher votre demande à la publicité qui l&apos;a générée. Si vous refusez les cookies, rien n&apos;est
            transmis.
          </p>
        </div>
      </div>
    </section>
  )
}
