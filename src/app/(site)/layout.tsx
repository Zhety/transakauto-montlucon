import { Analytics } from '@/components/analytics'
import { AnchorBehavior } from '@/components/anchor-behavior'
import { SiteFooter, SiteHeader } from '@/components/site-chrome'

/**
 * Habillage du site public : en-tête, pied de page, balise publicitaire.
 * Le tableau des leads (/board, servi aussi sur leads.transakautomontlucon.com)
 * n'est pas dans ce groupe et n'en hérite donc jamais — quel que soit le
 * chemin affiché dans le navigateur.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
      <AnchorBehavior />
      <Analytics />
    </>
  )
}
