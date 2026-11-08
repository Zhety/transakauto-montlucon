import type { Metadata } from 'next'
import { RequestPage } from '@/components/request-page'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
  title: 'Estimation voiture gratuite à Montluçon | Transakauto',
  description:
    "Combien vaut votre voiture ? Estimation gratuite et sans engagement par un professionnel, réponse sous 24h à Montluçon et dans tout l'Allier.",
  path: '/estimation',
})

export default function EstimationPage() {
  return (
    <RequestPage
      intent="estimation"
      path="/estimation"
      breadcrumb="Estimation gratuite"
      eyebrow="Estimation gratuite · sans engagement"
      title="Combien vaut votre voiture ? Estimation gratuite à Montluçon"
      intro="Deux minutes pour décrire votre véhicule, et nous vous transmettons une estimation détaillée : prix de vente réaliste, délai attendu et marge de négociation. Aucune obligation de vendre ensuite."
      benefits={[
        'Une fourchette de prix basée sur le marché local, pas sur une cote théorique',
        'Le délai de vente estimé pour votre modèle',
        'Les points qui font gagner ou perdre de la valeur sur votre véhicule',
        'Une commission fixée en accord avec vous, avant toute décision',
      ]}
      steps={[
        {
          title: 'Vous envoyez votre demande',
          body: 'Elle arrive immédiatement chez votre conseiller à Montluçon.',
        },
        {
          title: 'Nous analysons votre véhicule',
          body: 'Cote, annonces comparables et ventes réelles dans la région.',
        },
        {
          title: 'Vous recevez votre estimation',
          body: 'Par téléphone ou par email, sous 24h ouvrées.',
        },
        {
          title: 'Vous décidez',
          body: 'Vente accompagnée, reprise, ou rien du tout : le choix vous appartient.',
        },
      ]}
      alternate={{
        href: '/reprise',
        label: 'Faire une demande de reprise',
        hint: 'Vous voulez vendre tout de suite, sans attendre un acheteur ?',
      }}
      sections={[
        {
          title: 'Comment nous estimons votre voiture',
          paragraphs: [
            "Une cote en ligne donne une moyenne nationale, théorique. Nous partons de là, puis nous la confrontons aux annonces comparables actuellement en ligne et aux ventes réellement conclues dans la région, de Montluçon à Guéret et Saint-Amand-Montrond.",
            "C'est ce qui fait la différence entre un prix de vitrine, qui fait fuir les acheteurs, et un prix atteignable, qui fait vendre au meilleur montant.",
          ],
        },
        {
          title: 'Ce qui fait varier le prix',
          bullets: [
            "L'année et le kilométrage",
            "L'historique d'entretien : carnet à jour et factures",
            'Un contrôle technique récent, sans défaut majeur',
            "L'état de la carrosserie, de l'intérieur et des pneus",
            'Le nombre de propriétaires précédents',
            'La motorisation et la demande actuelle pour ce modèle',
          ],
        },
        {
          title: 'Simulateur en ligne ou estimation par un professionnel ?',
          paragraphs: [
            "Les simulateurs donnent un chiffre en quelques secondes, mais il s'agit souvent d'une offre de reprise, donc d'un prix bas. Notre estimation vous indique le prix de vente réaliste entre particuliers, le délai attendu et la marge de négociation.",
            "Vous savez ainsi ce que vaut vraiment votre voiture, et vous choisissez ensuite : vente accompagnée, reprise, ou rien du tout.",
          ],
        },
      ]}
      faq={[
        {
          q: "L'estimation est-elle vraiment gratuite ?",
          a: "Oui. Elle est gratuite et sans engagement : vous restez libre de vendre ou non, avec nous ou ailleurs.",
        },
        {
          q: "En combien de temps reçoit-on l'estimation ?",
          a: "Sous 24h ouvrées, par téléphone ou par email. Quelques photos du véhicule, du compteur et de la carte grise la rendent plus précise.",
        },
        {
          q: "Faut-il amener la voiture à l'agence ?",
          a: "Non. Pour une première estimation, la description de votre véhicule suffit. Votre conseiller vous dit ensuite comment se passent les étapes suivantes.",
        },
      ]}
      related={['/reprise', '/depot-vente-voiture-montlucon', '/vendre-voiture-credit-loa-montlucon']}
    />
  )
}
