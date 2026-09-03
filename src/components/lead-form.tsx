'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  CONDITIONS,
  FUELS,
  GEARBOXES,
  OWNERSHIPS,
  TECHNICAL_INSPECTIONS,
  TIMEFRAMES,
  type LeadIntent,
} from '@/lib/lead'

const STEPS = ['Votre véhicule', 'État et projet', 'Vos coordonnées'] as const

const field =
  'w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[15px] text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-ink'
const labelCls = 'mb-1.5 block text-sm font-medium text-graphite'

const CURRENT_YEAR = new Date().getFullYear()

type Vehicle = {
  make: string
  model: string
  version: string
  year: string
  mileageKm: string
  fuel: string
  gearbox: string
  plate: string
}

type Details = {
  condition: string
  technicalInspection: string
  serviceHistory: boolean
  firstHand: boolean
  damaged: boolean
  ownership: string
  expectedPriceEur: string
  timeframe: string
}

type Contact = {
  firstName: string
  lastName: string
  email: string
  phone: string
  postalCode: string
  city: string
  message: string
  consent: boolean
  website: string
}

const PHONE_RE = /^(?:(?:\+|00)33[\s.-]?(?:\(0\)[\s.-]?)?|0)[1-9](?:[\s.-]?\d{2}){4}$/

/** Paramètres de campagne : indispensables pour mesurer le coût par lead des ads. */
function readUtm(): Record<string, string> {
  const params = new URLSearchParams(window.location.search)
  const utm: Record<string, string> = {}
  for (const [key, value] of params.entries()) {
    if (key.startsWith('utm_') || key === 'gclid' || key === 'fbclid') utm[key] = value.slice(0, 200)
  }
  return utm
}

export function LeadForm({ intent }: { intent: LeadIntent }) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [utm, setUtm] = useState<Record<string, string>>({})

  useEffect(() => {
    setUtm(readUtm())
  }, [])

  const [vehicle, setVehicle] = useState<Vehicle>({
    make: '',
    model: '',
    version: '',
    year: '',
    mileageKm: '',
    fuel: '',
    gearbox: '',
    plate: '',
  })

  const [details, setDetails] = useState<Details>({
    condition: '',
    technicalInspection: '',
    serviceHistory: false,
    firstHand: false,
    damaged: false,
    ownership: '',
    expectedPriceEur: '',
    timeframe: '',
  })

  const [contact, setContact] = useState<Contact>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    postalCode: '',
    city: '',
    message: '',
    consent: false,
    website: '',
  })

  function validateStep(index: number): string[] {
    const found: string[] = []

    if (index === 0) {
      if (!vehicle.make.trim()) found.push('Indiquez la marque du véhicule.')
      if (!vehicle.model.trim()) found.push('Indiquez le modèle du véhicule.')
      const year = Number(vehicle.year)
      if (!vehicle.year || year < 1950 || year > CURRENT_YEAR + 1) found.push('Indiquez une année valide.')
      if (vehicle.mileageKm === '' || Number(vehicle.mileageKm) < 0) found.push('Indiquez le kilométrage.')
      if (!vehicle.fuel) found.push("Sélectionnez l'énergie.")
      if (!vehicle.gearbox) found.push('Sélectionnez le type de boîte.')
    }

    if (index === 1) {
      if (!details.condition) found.push("Sélectionnez l'état général du véhicule.")
    }

    if (index === 2) {
      if (contact.firstName.trim().length < 2) found.push('Indiquez votre prénom.')
      if (contact.lastName.trim().length < 2) found.push('Indiquez votre nom.')
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact.email.trim())) found.push('Indiquez un email valide.')
      if (!PHONE_RE.test(contact.phone.trim())) found.push('Indiquez un numéro de téléphone français valide.')
      if (!/^\d{5}$/.test(contact.postalCode.trim())) found.push('Indiquez un code postal à 5 chiffres.')
      if (!contact.consent) found.push('Merci d’accepter d’être recontacté.')
    }

    return found
  }

  function goNext() {
    const found = validateStep(step)
    setErrors(found)
    if (found.length) return
    setStep((current) => Math.min(current + 1, STEPS.length - 1))
    document.getElementById('formulaire')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function goBack() {
    setErrors([])
    setStep((current) => Math.max(current - 1, 0))
  }

  async function submit() {
    const found = validateStep(2)
    setErrors(found)
    if (found.length) return

    setSubmitting(true)

    const payload = {
      intent,
      make: vehicle.make,
      model: vehicle.model,
      version: vehicle.version || undefined,
      year: Number(vehicle.year),
      mileageKm: Number(vehicle.mileageKm),
      fuel: vehicle.fuel,
      gearbox: vehicle.gearbox,
      plate: vehicle.plate || undefined,
      condition: details.condition,
      technicalInspection: details.technicalInspection || undefined,
      serviceHistory: details.serviceHistory,
      firstHand: details.firstHand,
      damaged: details.damaged,
      ownership: details.ownership || undefined,
      expectedPriceEur: details.expectedPriceEur ? Number(details.expectedPriceEur) : undefined,
      timeframe: details.timeframe || undefined,
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone,
      postalCode: contact.postalCode,
      city: contact.city || undefined,
      message: contact.message || undefined,
      consent: contact.consent,
      website: contact.website,
      source: window.location.pathname + window.location.search,
      utm: Object.keys(utm).length ? utm : undefined,
    }

    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = (await response.json()) as { ok: boolean; errors?: string[] }

      if (!response.ok || !data.ok) {
        setErrors(data.errors?.length ? data.errors : ["L'envoi a échoué. Réessayez ou appelez-nous."])
        setSubmitting(false)
        return
      }

      // Relais vers /merci pour le suivi avancé des conversions Google Ads.
      // Les données restent dans l'onglet, sont hachées par gtag avant tout
      // envoi, et sont effacées dès la conversion déclarée.
      try {
        window.sessionStorage.setItem(
          'tam-lead',
          JSON.stringify({
            email: contact.email.trim().toLowerCase(),
            phone: contact.phone.trim(),
            firstName: contact.firstName.trim(),
            lastName: contact.lastName.trim(),
            postalCode: contact.postalCode.trim(),
          }),
        )
      } catch {
        /* navigation privée : on se passe du suivi avancé */
      }

      router.push(`/merci?type=${intent}`)
    } catch {
      setErrors(["L'envoi a échoué. Vérifiez votre connexion ou appelez-nous directement."])
      setSubmitting(false)
    }
  }

  return (
    <div id="formulaire" className="rounded-2xl border border-line bg-card p-5 shadow-sm sm:p-7">
      <ol className="mb-7 flex items-start gap-2">
        {STEPS.map((title, index) => (
          <li key={title} className="flex flex-1 flex-col gap-2">
            <span className={`h-1 rounded-full transition-colors ${index <= step ? 'bg-accent' : 'bg-line'}`} aria-hidden />
            <span className={`text-xs font-medium ${index === step ? 'text-ink' : 'text-muted'}`}>
              {index + 1}. {title}
            </span>
          </li>
        ))}
      </ol>

      {errors.length > 0 && (
        <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <ul className="space-y-1">
            {errors.map((error) => (
              <li key={error}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {step === 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="make">Marque *</label>
            <input
              id="make"
              className={field}
              placeholder="Peugeot, Renault, BMW…"
              value={vehicle.make}
              onChange={(event) => setVehicle({ ...vehicle, make: event.target.value })}
            />
          </div>

          <div>
            <label className={labelCls} htmlFor="model">Modèle *</label>
            <input
              id="model"
              className={field}
              placeholder="308, Clio, Série 3…"
              value={vehicle.model}
              onChange={(event) => setVehicle({ ...vehicle, model: event.target.value })}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="version">Version / finition</label>
            <input
              id="version"
              className={field}
              placeholder="1.5 BlueHDi 130 GT Line"
              value={vehicle.version}
              onChange={(event) => setVehicle({ ...vehicle, version: event.target.value })}
            />
          </div>

          <div>
            <label className={labelCls} htmlFor="year">Année *</label>
            <input
              id="year"
              type="number"
              inputMode="numeric"
              min={1950}
              max={CURRENT_YEAR + 1}
              className={field}
              placeholder="2019"
              value={vehicle.year}
              onChange={(event) => setVehicle({ ...vehicle, year: event.target.value })}
            />
          </div>

          <div>
            <label className={labelCls} htmlFor="mileage">Kilométrage *</label>
            <input
              id="mileage"
              type="number"
              inputMode="numeric"
              min={0}
              className={field}
              placeholder="98000"
              value={vehicle.mileageKm}
              onChange={(event) => setVehicle({ ...vehicle, mileageKm: event.target.value })}
            />
          </div>

          <div>
            <label className={labelCls} htmlFor="fuel">Énergie *</label>
            <select
              id="fuel"
              className={field}
              value={vehicle.fuel}
              onChange={(event) => setVehicle({ ...vehicle, fuel: event.target.value })}
            >
              <option value="">Sélectionner…</option>
              {FUELS.map((fuel) => (
                <option key={fuel} value={fuel}>{fuel}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls} htmlFor="gearbox">Boîte de vitesses *</label>
            <select
              id="gearbox"
              className={field}
              value={vehicle.gearbox}
              onChange={(event) => setVehicle({ ...vehicle, gearbox: event.target.value })}
            >
              <option value="">Sélectionner…</option>
              {GEARBOXES.map((gearbox) => (
                <option key={gearbox} value={gearbox}>{gearbox}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="plate">
              Immatriculation <span className="font-normal text-muted">(facultatif, accélère l&apos;estimation)</span>
            </label>
            <input
              id="plate"
              className={`${field} uppercase`}
              placeholder="AA-123-BB"
              value={vehicle.plate}
              onChange={(event) => setVehicle({ ...vehicle, plate: event.target.value })}
            />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="condition">État général *</label>
            <select
              id="condition"
              className={field}
              value={details.condition}
              onChange={(event) => setDetails({ ...details, condition: event.target.value })}
            >
              <option value="">Sélectionner…</option>
              {CONDITIONS.map((condition) => (
                <option key={condition.value} value={condition.value}>{condition.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls} htmlFor="ct">Contrôle technique</label>
            <select
              id="ct"
              className={field}
              value={details.technicalInspection}
              onChange={(event) => setDetails({ ...details, technicalInspection: event.target.value })}
            >
              <option value="">Sélectionner…</option>
              {TECHNICAL_INSPECTIONS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls} htmlFor="ownership">Situation du véhicule</label>
            <select
              id="ownership"
              className={field}
              value={details.ownership}
              onChange={(event) => setDetails({ ...details, ownership: event.target.value })}
            >
              <option value="">Sélectionner…</option>
              {OWNERSHIPS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls} htmlFor="price">
              Prix espéré <span className="font-normal text-muted">(facultatif)</span>
            </label>
            <input
              id="price"
              type="number"
              inputMode="numeric"
              min={0}
              className={field}
              placeholder="12000"
              value={details.expectedPriceEur}
              onChange={(event) => setDetails({ ...details, expectedPriceEur: event.target.value })}
            />
          </div>

          <div>
            <label className={labelCls} htmlFor="timeframe">Vous souhaitez vendre</label>
            <select
              id="timeframe"
              className={field}
              value={details.timeframe}
              onChange={(event) => setDetails({ ...details, timeframe: event.target.value })}
            >
              <option value="">Sélectionner…</option>
              {TIMEFRAMES.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>

          <fieldset className="sm:col-span-2">
            <legend className={labelCls}>Historique</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {([
                ['serviceHistory', "Carnet d'entretien à jour"],
                ['firstHand', 'Première main'],
                ['damaged', 'Véhicule accidenté'],
              ] as const).map(([key, label]) => (
                <label
                  key={key}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm transition-colors ${
                    details[key] ? 'border-ink bg-ink/5' : 'border-line hover:border-muted'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="size-4 accent-ink"
                    checked={details[key]}
                    onChange={(event) => setDetails({ ...details, [key]: event.target.checked })}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="firstName">Prénom *</label>
            <input
              id="firstName"
              autoComplete="given-name"
              className={field}
              value={contact.firstName}
              onChange={(event) => setContact({ ...contact, firstName: event.target.value })}
            />
          </div>

          <div>
            <label className={labelCls} htmlFor="lastName">Nom *</label>
            <input
              id="lastName"
              autoComplete="family-name"
              className={field}
              value={contact.lastName}
              onChange={(event) => setContact({ ...contact, lastName: event.target.value })}
            />
          </div>

          <div>
            <label className={labelCls} htmlFor="email">Email *</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className={field}
              placeholder="prenom@email.fr"
              value={contact.email}
              onChange={(event) => setContact({ ...contact, email: event.target.value })}
            />
          </div>

          <div>
            <label className={labelCls} htmlFor="phone">Téléphone *</label>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              className={field}
              placeholder="06 12 34 56 78"
              value={contact.phone}
              onChange={(event) => setContact({ ...contact, phone: event.target.value })}
            />
          </div>

          <div>
            <label className={labelCls} htmlFor="postalCode">Code postal *</label>
            <input
              id="postalCode"
              inputMode="numeric"
              autoComplete="postal-code"
              className={field}
              placeholder="57000"
              value={contact.postalCode}
              onChange={(event) => setContact({ ...contact, postalCode: event.target.value })}
            />
          </div>

          <div>
            <label className={labelCls} htmlFor="city">Ville</label>
            <input
              id="city"
              autoComplete="address-level2"
              className={field}
              placeholder="Montluçon"
              value={contact.city}
              onChange={(event) => setContact({ ...contact, city: event.target.value })}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="message">
              Précisions <span className="font-normal text-muted">(options, entretien récent, défauts…)</span>
            </label>
            <textarea
              id="message"
              rows={4}
              className={field}
              placeholder="Distribution changée en 2024, 4 pneus neufs, attelage…"
              value={contact.message}
              onChange={(event) => setContact({ ...contact, message: event.target.value })}
            />
          </div>

          {/* Leurre anti-robot : masqué aux humains comme aux lecteurs d'écran. */}
          <div aria-hidden className="hidden">
            <label htmlFor="website">Site web</label>
            <input
              id="website"
              tabIndex={-1}
              autoComplete="off"
              value={contact.website}
              onChange={(event) => setContact({ ...contact, website: event.target.value })}
            />
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-paper px-4 py-3 text-sm text-graphite sm:col-span-2">
            <input
              type="checkbox"
              className="mt-0.5 size-4 shrink-0 accent-ink"
              checked={contact.consent}
              onChange={(event) => setContact({ ...contact, consent: event.target.checked })}
            />
            <span>
              J&apos;accepte d&apos;être recontacté par Transakauto Montluçon au sujet de ma demande. Mes données ne sont ni
              revendues ni utilisées à d&apos;autres fins. *
            </span>
          </label>
        </div>
      )}

      <div className="mt-7 flex items-center justify-between gap-3">
        {step > 0 ? (
          <button
            type="button"
            onClick={goBack}
            className="rounded-full border border-line px-5 py-2.5 text-sm font-medium text-graphite transition-colors hover:border-ink hover:text-ink"
          >
            Retour
          </button>
        ) : (
          <span className="text-xs text-muted">Gratuit et sans engagement</span>
        )}

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={goNext}
            className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-px"
          >
            Continuer
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Envoi…' : 'Envoyer ma demande'}
          </button>
        )}
      </div>
    </div>
  )
}
