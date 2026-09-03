'use client'

import { useEffect } from 'react'
import { CONVERSION_LABEL, CONVERSION_VALUE, GOOGLE_ADS_ID } from '@/lib/ads'

const STORAGE_KEY = 'tam-lead'

interface StoredLead {
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
  postalCode?: string
}

/** Google exige le format international E.164 pour le numéro de téléphone. */
function toE164(phone?: string): string | undefined {
  if (!phone) return undefined
  const digits = phone.replace(/[^\d+]/g, '')
  if (digits.startsWith('+')) return digits
  if (digits.startsWith('00')) return `+${digits.slice(2)}`
  if (digits.startsWith('0')) return `+33${digits.slice(1)}`
  return undefined
}

/**
 * Lit les coordonnées déposées par le formulaire pour le suivi avancé des
 * conversions : gtag les hache (SHA-256) dans le navigateur avant de les
 * envoyer, Google ne reçoit jamais l'email en clair. Elles sont effacées
 * aussitôt, et rien ne part si le visiteur a refusé les cookies — le mode
 * Consentement bloque `ad_user_data`.
 */
function readAndClearLead(): StoredLead | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    window.sessionStorage.removeItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StoredLead) : null
  } catch {
    return null
  }
}

/**
 * Déclare la conversion Google Ads à l'arrivée sur /merci, c'est-à-dire
 * uniquement quand une demande a réellement été envoyée. Silencieux tant que le
 * libellé de conversion n'est pas renseigné.
 */
export function ConversionTracker({ intent }: { intent: string }) {
  useEffect(() => {
    if (!CONVERSION_LABEL) return

    const lead = readAndClearLead()

    if (lead?.email) {
      window.gtag?.('set', 'user_data', {
        email: lead.email,
        phone_number: toE164(lead.phone),
        address: {
          first_name: lead.firstName,
          last_name: lead.lastName,
          postal_code: lead.postalCode,
          country: 'FR',
        },
      })
    }

    window.gtag?.('event', 'conversion', {
      send_to: `${GOOGLE_ADS_ID}/${CONVERSION_LABEL}`,
      value: CONVERSION_VALUE,
      currency: 'EUR',
      // Permet de distinguer les deux formulaires dans les rapports Ads.
      transaction_id: `${intent}-${Date.now()}`,
    })
  }, [intent])

  return null
}
