import type { Metadata } from 'next'
import { SITE } from '@/lib/site'

export const metadata: Metadata = {
  // `absolute` : sans quoi le gabarit du site ajouterait « — Transakauto Montluçon ».
  title: { absolute: `Tableau des leads — ${SITE.name}` },
  // Outil interne : jamais dans les résultats de recherche.
  robots: { index: false, follow: false },
}

/**
 * Le tableau ne partage pas l'en-tête ni le pied de page du site public : c'est
 * un outil, pas une vitrine.
 */
export default function BoardLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-paper">{children}</div>
}
