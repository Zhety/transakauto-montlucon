import type { Metadata } from 'next'
import { RequestPage } from '@/components/request-page'

export const metadata: Metadata = {
  title: "Estimation gratuite de voiture",
  description:
    "Combien vaut votre voiture ? Estimation gratuite et sans engagement par un professionnel, réponse sous 24h à Montluçon et dans tout l'Allier.",
  alternates: { canonical: '/estimation' },
  openGraph: {
    title: "Estimation gratuite de voiture à Montluçon — Transakauto",
    description: "Combien vaut votre voiture ? Estimation gratuite et sans engagement par un professionnel, réponse sous 24h à Montluçon et dans tout l'Allier.",
    url: '/estimation', images: ['/opengraph-image'] 
  },
  twitter: { title: "Estimation gratuite de voiture à Montluçon", description: "Combien vaut votre voiture ? Estimation gratuite et sans engagement par un professionnel, réponse sous 24h à Montluçon et dans tout l'Allier." },
}

export default function EstimationPage() {
  return (
    <RequestPage
      intent="estimation"
      eyebrow="Estimation gratuite · sans engagement"
      title="Combien vaut réellement votre voiture ?"
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
        hint: 'Vous voulez vendre tout de suite, sans attendre un acheteur ?',
      }}
    />
  )
}
