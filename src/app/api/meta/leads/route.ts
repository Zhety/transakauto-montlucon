import crypto from 'node:crypto'
import { NextResponse } from 'next/server'
import { leadToRow } from '@/lib/leads-board'
import { sendLeadEmails } from '@/lib/mail'
import { canWriteLeads, createAdminSupabase } from '@/lib/supabase'

/**
 * Passerelle des formulaires instantanés Meta (Facebook / Instagram).
 *
 * Ces demandes ne passent jamais par le site : Meta notifie cette route, qui
 * va ensuite chercher le contenu du lead sur l'API Graph — la notification ne
 * contient que son identifiant.
 *
 * Meta rejoue les événements non acquittés : la réponse doit rester rapide et
 * l'insertion est protégée par une contrainte d'unicité sur `meta_lead_id`.
 */

const APP_SECRET = process.env.META_APP_SECRET
const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN
const PAGE_TOKEN = process.env.META_PAGE_ACCESS_TOKEN
const GRAPH = 'https://graph.facebook.com/v21.0'

/** Vérification de l'abonnement, appelée une fois par Meta à la configuration. */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams

  if (
    params.get('hub.mode') === 'subscribe' &&
    VERIFY_TOKEN &&
    params.get('hub.verify_token') === VERIFY_TOKEN
  ) {
    return new NextResponse(params.get('hub.challenge') ?? '', { status: 200 })
  }

  return new NextResponse('Forbidden', { status: 403 })
}

/**
 * Authentifie la requête : sans cette vérification, n'importe qui pourrait
 * injecter de faux leads dans le tableau.
 */
function isFromMeta(rawBody: string, signature: string | null): boolean {
  if (!APP_SECRET || !signature?.startsWith('sha256=')) return false

  const expected = crypto.createHmac('sha256', APP_SECRET).update(rawBody).digest('hex')
  const received = signature.slice('sha256='.length)

  // Comparaison à temps constant : une comparaison naïve fuit l'empreinte.
  const a = Buffer.from(expected, 'hex')
  const b = Buffer.from(received, 'hex')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

interface MetaField {
  name: string
  values: string[]
}

/** Premier champ dont le nom contient l'un des mots donnés. */
function pick(fields: MetaField[], ...keys: string[]): string | undefined {
  for (const key of keys) {
    const found = fields.find((field) => field.name.toLowerCase().includes(key))
    const value = found?.values?.[0]?.trim()
    if (value) return value
  }
  return undefined
}

/**
 * Un formulaire Meta ne demande pas toujours le nom : Meta l'affiche depuis le
 * profil Facebook, mais ne le transmet pas par l'API. On le reconstitue depuis
 * l'email — « jonathan.bousard@… » donne « Jonathan Bousard » — plutôt que de
 * remplir le tableau de fiches « Inconnu ».
 */
function nameFromEmail(email?: string): string[] | null {
  if (!email) return null
  const parts = email
    .split('@')[0]
    .split(/[._\-+]+/)
    .map((part) => part.replace(/\d+/g, ''))
    .filter((part) => part.length > 2)
  if (!parts.length) return null
  return parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
}

function splitName(fields: MetaField[]): { firstName: string; lastName: string | null } {
  const first = pick(fields, 'first_name', 'prenom', 'prénom')
  const last = pick(fields, 'last_name', 'nom_de_famille')
  if (first) return { firstName: first, lastName: last ?? null }

  const full = pick(fields, 'full_name', 'nom')
  if (full) {
    const [head, ...rest] = full.split(/\s+/)
    return { firstName: head, lastName: rest.join(' ') || null }
  }

  const derived = nameFromEmail(pick(fields, 'email'))
  if (derived) return { firstName: derived[0], lastName: derived.slice(1).join(' ') || null }
  return { firstName: 'Inconnu', lastName: null }
}

/**
 * Premier nombre d'un texte libre : « 141000 », « 120 000 km, embrayage à
 * prévoir ». On ne retient que le premier groupe, sinon les chiffres d'un
 * commentaire se colleraient au kilométrage.
 */
function toNumber(value?: string): number | null {
  if (!value) return null
  const match = value.match(/\d[\d\s.]*/)
  if (!match) return null
  const n = Number(match[0].replace(/[\s.]/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
}

/** Traduit les réponses du formulaire Meta en demande, au format du site. */
function metaLeadToLead(fields: MetaField[], formName: string) {
  const { firstName, lastName } = splitName(fields)
  const year = toNumber(pick(fields, 'year', 'annee', 'année'))

  return {
    // `reprise` si le formulaire le mentionne, `estimation` par défaut : c'est
    // la demande la plus courante et la moins engageante.
    intent: /reprise|rachat/i.test(formName) ? ('reprise' as const) : ('estimation' as const),
    make: pick(fields, 'make', 'marque'),
    model: pick(fields, 'model', 'modele', 'modèle'),
    year: year && year > 1950 && year < 2100 ? year : undefined,
    mileageKm: toNumber(pick(fields, 'mileage', 'kilometrage', 'kilométrage', 'informations', 'km')) ?? undefined,
    plate: pick(fields, 'immatriculation', 'plate', 'plaque'),
    firstName,
    lastName: lastName ?? undefined,
    email: pick(fields, 'email'),
    phone: pick(fields, 'phone', 'telephone', 'téléphone'),
    postalCode: pick(fields, 'post_code', 'zip', 'code_postal'),
    city: pick(fields, 'city', 'ville'),
    // Le champ libre sert deux fois : on en extrait le kilométrage, et on garde
    // le texte entier, qui contient souvent les frais à prévoir ou les options.
    message: pick(fields, 'message', 'commentaire', 'informations', 'precision', 'précision'),
    source: `Meta — ${formName}`,
    consent: true,
  }
}

export async function POST(request: Request) {
  const raw = await request.text()

  if (!isFromMeta(raw, request.headers.get('x-hub-signature-256'))) {
    return new NextResponse('Invalid signature', { status: 401 })
  }

  if (!PAGE_TOKEN || !canWriteLeads) {
    console.error('[meta] passerelle appelée sans configuration complète')
    // 200 malgré tout : un échec ferait rejouer l'événement en boucle.
    return NextResponse.json({ ok: true })
  }

  let body: { entry?: Array<{ changes?: Array<{ value?: { leadgen_id?: string; form_id?: string } }> }> }
  try {
    body = JSON.parse(raw)
  } catch {
    return NextResponse.json({ ok: true })
  }

  const ids = (body.entry ?? [])
    .flatMap((entry) => entry.changes ?? [])
    .map((change) => change.value?.leadgen_id)
    .filter((id): id is string => Boolean(id))

  for (const leadId of ids) {
    try {
      const response = await fetch(
        `${GRAPH}/${leadId}?fields=field_data,form_id&access_token=${encodeURIComponent(PAGE_TOKEN)}`,
      )
      const data = (await response.json()) as {
        field_data?: MetaField[]
        form_id?: string
        error?: { message: string }
      }
      if (data.error) throw new Error(data.error.message)

      const lead = metaLeadToLead(data.field_data ?? [], data.form_id ?? 'formulaire Meta')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row = { ...leadToRow(lead as any), meta_lead_id: leadId }
      const { error } = await createAdminSupabase().from('leads').insert(row)

      // 23505 : lead déjà enregistré, Meta a simplement rejoué l'événement.
      if (error && error.code !== '23505') throw new Error(error.message)

      // L'agence est prévenue comme pour une demande du site. Sans adresse
      // email, l'accusé de réception au client n'a pas de destinataire : seule
      // la notification interne part.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!error) await sendLeadEmails(lead as any)
    } catch (error) {
      console.error(`[meta] lead ${leadId} non traité`, error)
    }
  }

  return NextResponse.json({ ok: true })
}
