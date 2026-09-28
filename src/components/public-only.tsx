'use client'

import { usePathname } from 'next/navigation'

/**
 * Masque l'habillage du site public (en-tête, pied de page, balise
 * publicitaire) sur le tableau des leads : c'est un outil interne, il n'a ni
 * vocation commerciale ni mesure d'audience.
 */
export function PublicOnly({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname?.startsWith('/board')) return null
  return <>{children}</>
}
