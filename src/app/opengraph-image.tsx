import { ImageResponse } from 'next/og'
import { SITE } from '@/lib/site'

/**
 * Aperçu affiché quand un lien du site est partagé (WhatsApp, Facebook,
 * LinkedIn, iMessage). Sans lui, le lien apparaît nu — ce qui coûte cher en
 * taux de clic quand l'annonce circule de particulier à particulier.
 */
export const alt = `${SITE.name} — vendez votre voiture au meilleur prix`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#000000',
          // Dégradé plutôt qu'un cercle flouté : le moteur de rendu des images
          // OG n'applique pas `blur`, un disque net serait disgracieux.
          backgroundImage:
            'radial-gradient(circle at 88% 8%, rgba(236, 0, 140, 0.45) 0%, rgba(236, 0, 140, 0.10) 38%, rgba(0, 0, 0, 0) 62%)',
          padding: '64px 72px',
        }}
      >

        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <div style={{ fontSize: 40, fontWeight: 700, color: '#ffffff', letterSpacing: 6 }}>TRANSAK</div>
          <div style={{ fontSize: 40, fontWeight: 400, color: '#ec008c', letterSpacing: 6 }}>AUTO</div>
          <div style={{ fontSize: 18, color: '#8e949d', letterSpacing: 8, marginLeft: 24 }}>MONTLUÇON</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 66, fontWeight: 700, color: '#ffffff', lineHeight: 1.1, letterSpacing: -1 }}>
            Vendez votre voiture
          </div>
          <div style={{ fontSize: 66, fontWeight: 700, color: '#ec008c', lineHeight: 1.1, letterSpacing: -1 }}>
            au meilleur prix.
          </div>
          <div style={{ fontSize: 28, color: '#c4c8d0', marginTop: 28 }}>
            Estimation gratuite sous 24h · Montluçon, Saint-Amand, Guéret et tout l'Allier
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: 190, height: 6, background: '#ec008c' }} />
          <div style={{ fontSize: 24, color: '#8e949d', marginLeft: 24 }}>transakautomontlucon.com</div>
        </div>
      </div>
    ),
    size,
  )
}
