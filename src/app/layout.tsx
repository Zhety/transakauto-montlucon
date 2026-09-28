import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import { SITE } from '@/lib/site'
import './globals.css'

/** Police de la charte Transakauto. */
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
})

const noindex = process.env.NEXT_PUBLIC_NOINDEX === 'true'

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Vendre sa voiture à Montluçon et dans l'Allier | Transakauto",
    template: `%s — ${SITE.name}`,
  },
  description:
    "Estimation gratuite sous 24h, annonce, visites et paiement sécurisé : nous vendons votre voiture à votre place. Montluçon, Allier, Cher et Creuse.",
  applicationName: SITE.name,
  authors: [{ name: SITE.legalName }],
  creator: SITE.legalName,
  publisher: SITE.legalName,
  keywords: [
    'vendre sa voiture Montluçon',
    'estimation voiture gratuite Montluçon',
    'reprise voiture Montluçon',
    'rachat voiture Saint-Amand-Montrond',
    'vendre sa voiture Guéret',
    'vendre voiture occasion Allier',
    'intermédiation automobile Auvergne',
    'mandataire auto Montluçon',
    'Transakauto Montluçon',
  ],
  category: 'automotive',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: SITE.name,
    url: SITE.url,
    title: "Vendre sa voiture à Montluçon et dans l'Allier | Transakauto",
    description:
      "Estimation gratuite sous 24h, vente accompagnée ou reprise immédiate. Nous vendons votre véhicule à votre place, en toute sécurité.",
  },
  twitter: {
    card: 'summary_large_image',
    title: "Vendre sa voiture à Montluçon et dans l'Allier | Transakauto",
    description: 'Estimation gratuite sous 24h. Nous vendons votre véhicule à votre place, en toute sécurité.',
  },
  // Le blocage d'indexation vaut aussi pour les balises meta, pas seulement
  // pour robots.txt : certains moteurs suivent l'un sans l'autre.
  robots: noindex
    ? { index: false, follow: false }
    : { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
  other: {
    'geo.region': 'FR-ARA',
    'geo.placename': 'Montluçon',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={poppins.variable}>
      <body className="min-h-screen bg-paper text-ink">{children}</body>
    </html>
  )
}
