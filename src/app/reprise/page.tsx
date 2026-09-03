import type { Metadata } from 'next'
import { RequestPage } from '@/components/request-page'

export const metadata: Metadata = {
  title: "Reprise et rachat de voiture",
  description:
    "Faites reprendre votre voiture à Montluçon : rachat ferme sous 24h, paiement sécurisé, crédit ou LOA soldé. Toutes marques, tout kilométrage.",
  alternates: { canonical: '/reprise' },
  openGraph: {
    title: "Reprise et rachat de voiture à Montluçon — Transakauto",
    description: "Faites reprendre votre voiture à Montluçon : rachat ferme sous 24h, paiement sécurisé, crédit ou LOA soldé. Toutes marques, tout kilométrage.",
    url: '/reprise', images: ['/opengraph-image'] 
  },
  twitter: { title: "Reprise et rachat de voiture à Montluçon", description: "Faites reprendre votre voiture à Montluçon : rachat ferme sous 24h, paiement sécurisé, crédit ou LOA soldé. Toutes marques, tout kilométrage." },
}

export default function ReprisePage() {
  return (
    <RequestPage
      intent="reprise"
      eyebrow="Reprise · proposition sous 24h"
      title="Faites reprendre votre véhicule, rapidement et en sécurité."
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
        hint: "Pas pressé ? Une vente accompagnée rapporte en général davantage.",
      }}
    />
  )
}
