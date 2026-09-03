'use client'

import { useEffect } from 'react'

/**
 * Défilement vers les sections sans laisser d'ancre dans l'URL : un
 * `transakautomontlucon.com/#faq` dans la barre d'adresse n'apporte rien au visiteur
 * et pollue les URLs partagées.
 *
 * Les liens gardent leur `href` réel — indispensable pour le référencement et
 * pour la navigation depuis une autre page ; seul le comportement au clic est
 * intercepté, et l'ancre est nettoyée à l'arrivée.
 */
export function AnchorBehavior() {
  useEffect(() => {
    const { hash, pathname, search } = window.location

    // Arrivée depuis une autre page (/estimation → /#faq) : on rejoint la
    // section, puis on retire le # de l'URL.
    if (hash) {
      const target = document.getElementById(decodeURIComponent(hash.slice(1)))
      if (target) {
        requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }))
        window.history.replaceState(null, '', pathname + search)
      }
    }

    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const anchor = (event.target as HTMLElement | null)?.closest?.('a[href*="#"]') as HTMLAnchorElement | null
      if (!anchor || anchor.target === '_blank') return

      const url = new URL(anchor.href, window.location.origin)
      if (url.origin !== window.location.origin || !url.hash) return
      // Lien vers une autre page : navigation normale.
      if (url.pathname !== window.location.pathname) return

      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)))
      if (!target) return

      event.preventDefault()
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  return null
}
