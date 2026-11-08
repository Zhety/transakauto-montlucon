import type { Metadata } from 'next'
import { RequestPage } from '@/components/request-page'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
  title: 'Rachat et reprise de voiture à Montluçon | Transakauto',
  description:
    'Faites reprendre votre voiture à Montluçon : rachat ferme sous 24h, paiement sécurisé, crédit ou LOA soldé. Toutes marques, tout kilométrage.',
  path: '/reprise',
})

export default function ReprisePage() {
  return (
    <RequestPage
      intent="reprise"
      path="/reprise"
      breadcrumb="Rachat et reprise"
      eyebrow="Reprise · proposition sous 24h"
      title="Rachat et reprise de votre voiture à Montluçon, rapidement et en sécurité"
      intro="Vous avez besoin de vendre vite, de financer un nouveau véhicule ou de solder un crédit. Décrivez votre voiture : nous revenons vers vous avec une proposition de rachat ferme et un paiement sécurisé."
      benefits={[
        'Une proposition de reprise chiffrée sous 24h ouvrées',
        'Toutes marques et tout kilométrage, véhicule en état de rouler',
        'Crédit, LOA ou leasing soldé directement dans la transaction',
        'Carte grise, déclaration de cession et non-gage pris en charge',
      ]}
      steps={[
        {
          title: 'Vous envoyez votre demande',
          body: 'Elle arrive immédiatement chez votre conseiller à Montluçon.',
        },
        {
          title: 'Nous chiffrons la reprise',
          body: 'Selon le modèle, son état et la demande actuelle du marché.',
        },
        {
          title: 'Nous vous faisons une offre',
          body: 'Un montant clair, valable plusieurs jours, sans engagement.',
        },
        {
          title: 'Vous êtes payé',
          body: 'Après vérification du véhicule et des documents, paiement rapide et sécurisé.',
        },
      ]}
      alternate={{
        href: '/estimation',
        label: 'Demander une estimation',
        hint: 'Pas pressé ? Une vente accompagnée rapporte en général davantage.',
      }}
      sections={[
        {
          title: 'Reprise ou vente accompagnée : que choisir ?',
          paragraphs: [
            "La reprise est la solution la plus rapide : vous recevez une offre de rachat ferme et la transaction peut être bouclée en quelques jours. Le montant est en général un peu inférieur au prix d'une vente entre particuliers.",
            "La vente accompagnée vise le meilleur prix : nous vendons votre voiture à un particulier, en 22 jours en moyenne, et vous continuez à l'utiliser jusqu'à la vente. Vous hésitez ? Demandez les deux, et comparez.",
          ],
        },
        {
          title: "Comment est calculée l'offre de reprise",
          bullets: [
            'Le modèle, la motorisation et la demande actuelle du marché',
            "L'année, le kilométrage et l'historique d'entretien",
            "L'état général et les éventuels frais de remise en état",
            'Le contrôle technique et les documents du véhicule',
          ],
        },
        {
          title: 'Votre voiture est en crédit ou en LOA ?',
          paragraphs: [
            "Ce n'est pas un obstacle. Nous calculons le solde restant dû avec votre organisme de financement et l'intégrons à la transaction : l'organisme est remboursé, vous encaissez la différence.",
          ],
        },
      ]}
      faq={[
        {
          q: "L'offre de reprise est-elle ferme ?",
          a: "Oui. L'offre est ferme et valable plusieurs jours, sous réserve que le véhicule et ses documents correspondent à la description que vous nous avez faite.",
        },
        {
          q: 'Reprenez-vous les voitures en panne ou accidentées ?',
          a: "Non. Nous reprenons tous les véhicules en état de rouler, toutes marques et tout kilométrage, mais pas les véhicules en panne ou immobilisés.",
        },
        {
          q: "Quels documents faut-il pour la reprise ?",
          a: "La carte grise à votre nom, votre pièce d'identité, le contrôle technique de moins de six mois si la voiture a plus de quatre ans, le carnet d'entretien et les doubles des clés. Nous nous chargeons du certificat de situation administrative et de la déclaration de cession.",
        },
      ]}
      related={['/estimation', '/vendre-voiture-credit-loa-montlucon', '/depot-vente-voiture-montlucon']}
    />
  )
}
