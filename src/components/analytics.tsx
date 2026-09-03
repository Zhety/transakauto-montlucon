'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'
import { CONSENT_STORAGE_KEY, GOOGLE_ADS_ID } from '@/lib/ads'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

type Choice = 'granted' | 'denied'

const GRANTED = {
  ad_storage: 'granted',
  ad_user_data: 'granted',
  ad_personalization: 'granted',
  analytics_storage: 'granted',
} as const

const DENIED = {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
} as const

function readChoice(): Choice | null {
  try {
    const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY)
    return stored === 'granted' || stored === 'denied' ? stored : null
  } catch {
    return null
  }
}

/**
 * Balise Google chargée avec le mode Consentement v2 : par défaut tout est
 * refusé, donc aucun cookie publicitaire n'est déposé tant que le visiteur n'a
 * pas accepté. Google reçoit malgré tout des mesures anonymes, ce qui permet
 * d'estimer les conversions des visiteurs qui refusent — d'où le choix du mode
 * Consentement plutôt qu'un simple blocage du script.
 */
export function Analytics() {
  const [choice, setChoice] = useState<Choice | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setChoice(readChoice())
    setReady(true)
  }, [])

  // Pas de compte Google Ads configuré : ni balise, ni cookie, donc pas de
  // bandeau de consentement à afficher.
  if (!GOOGLE_ADS_ID) return null

  function decide(next: Choice) {
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, next)
    } catch {
      /* navigation privée : le choix ne sera pas mémorisé, tant pis */
    }
    setChoice(next)
    window.gtag?.('consent', 'update', next === 'granted' ? GRANTED : DENIED)
  }

  return (
    <>
      {/* Doit s'exécuter avant le chargement de gtag.js. */}
      <Script id="consent-default" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          var stored = null;
          try { stored = window.localStorage.getItem('${CONSENT_STORAGE_KEY}'); } catch (e) {}
          gtag('consent', 'default', stored === 'granted'
            ? { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted' }
            : { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied', wait_for_update: 500 });
          gtag('js', new Date());
        `}
      </Script>

      <Script
        id="gtag-src"
        src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`}
        strategy="afterInteractive"
      />

      <Script id="gtag-config" strategy="afterInteractive">
        {`gtag('config', '${GOOGLE_ADS_ID}');`}
      </Script>

      {ready && choice === null && (
        <div
          role="dialog"
          aria-label="Gestion des cookies"
          className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-3xl rounded-2xl border border-line bg-card p-5 shadow-lg sm:inset-x-6 sm:p-6"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-relaxed text-graphite">
              Nous utilisons des cookies de mesure publicitaire pour savoir quelles annonces amènent des demandes.
              Aucun cookie n&apos;est déposé sans votre accord.{' '}
              <a href="/confidentialite" className="font-medium text-ink underline underline-offset-4">
                En savoir plus
              </a>
            </p>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => decide('denied')}
                className="rounded-full border border-line px-5 py-2.5 text-sm font-medium text-graphite transition-colors hover:border-ink hover:text-ink"
              >
                Refuser
              </button>
              <button
                type="button"
                onClick={() => decide('granted')}
                className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-px"
              >
                Accepter
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
