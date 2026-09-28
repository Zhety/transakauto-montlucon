/**
 * Import unique des prospects déjà présents dans le Centre de prospects Meta.
 *
 * Le webhook ne reçoit que les nouveaux leads : l'historique doit être récupéré
 * une fois, à la main. Le script parcourt chaque formulaire de la Page, pagine
 * les leads, et les insère avec la même correspondance de champs que la
 * passerelle. Les leads déjà présents sont ignorés (contrainte d'unicité sur
 * meta_lead_id), le script est donc rejouable sans risque de doublon.
 *
 *   node --env-file=.env.local scripts/import-meta-leads.mjs [--dry]
 */

import { createClient } from '@supabase/supabase-js'

const GRAPH = 'https://graph.facebook.com/v21.0'
const TOKEN = process.env.META_PAGE_ACCESS_TOKEN
const DRY = process.argv.includes('--dry')

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

if (!TOKEN) {
  console.error('META_PAGE_ACCESS_TOKEN manquant dans .env.local')
  process.exit(1)
}

async function graph(path) {
  const url = path.startsWith('http') ? path : `${GRAPH}/${path}`
  const sep = url.includes('?') ? '&' : '?'
  const response = await fetch(`${url}${sep}access_token=${encodeURIComponent(TOKEN)}`)
  const data = await response.json()
  if (data.error) throw new Error(data.error.message)
  return data
}

const pick = (fields, ...keys) => {
  for (const key of keys) {
    const found = fields.find((f) => f.name.toLowerCase().includes(key))
    const value = found?.values?.[0]?.trim()
    if (value) return value
  }
  return null
}

function toNumber(value) {
  if (!value) return null
  const match = value.match(/\d[\d\s.]*/)
  if (!match) return null
  const n = Number(match[0].replace(/[\s.]/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
}

function splitName(fields) {
  const first = pick(fields, 'first_name', 'prenom', 'prénom')
  const last = pick(fields, 'last_name', 'nom_de_famille')
  if (first) return [first, last]
  const full = pick(fields, 'full_name', 'nom') ?? 'Inconnu'
  const [head, ...rest] = full.split(/\s+/)
  return [head, rest.join(' ') || null]
}

function toRow(lead, formName) {
  const fields = lead.field_data ?? []
  const [firstName, lastName] = splitName(fields)
  const year = toNumber(pick(fields, 'year', 'annee', 'année'))

  return {
    created_at: lead.created_time,
    intent: /reprise|rachat/i.test(formName) ? 'reprise' : 'estimation',
    make: pick(fields, 'make', 'marque'),
    model: pick(fields, 'model', 'modele', 'modèle'),
    year: year && year > 1950 && year < 2100 ? year : null,
    mileage_km: toNumber(pick(fields, 'mileage', 'kilometrage', 'kilométrage', 'informations', 'km')),
    plate: pick(fields, 'immatriculation', 'plate', 'plaque'),
    first_name: firstName,
    last_name: lastName,
    email: pick(fields, 'email') ?? '',
    phone: pick(fields, 'phone', 'telephone', 'téléphone'),
    postal_code: pick(fields, 'post_code', 'zip', 'code_postal'),
    city: pick(fields, 'city', 'ville'),
    message: pick(fields, 'message', 'commentaire', 'informations', 'precision', 'précision'),
    source: `Meta — ${formName}`,
    meta_lead_id: lead.id,
  }
}

const pages = await graph('me/accounts?fields=id,name')
let total = 0
let inserted = 0

for (const page of pages.data ?? []) {
  console.log(`\nPage ${page.name}`)
  const forms = await graph(`${page.id}/leadgen_forms?fields=id,name&limit=100`)

  for (const form of forms.data ?? []) {
    let next = `${form.id}/leads?fields=id,created_time,field_data&limit=100`
    let count = 0

    while (next) {
      const batch = await graph(next)
      const rows = (batch.data ?? []).map((lead) => toRow(lead, form.name))
      count += rows.length
      total += rows.length

      if (rows.length && !DRY) {
        // onConflict : un lead déjà importé est laissé tel quel, le script
        // reste rejouable.
        const { error, count: n } = await supabase
          .from('leads')
          .upsert(rows, { onConflict: 'meta_lead_id', ignoreDuplicates: true, count: 'exact' })
        if (error) console.error(`  ! ${form.name} : ${error.message}`)
        else inserted += n ?? 0
      }

      next = batch.paging?.next ?? null
    }

    console.log(`  ${form.name} : ${count} prospect(s)`)
  }
}

console.log(`\n${total} prospect(s) lus, ${DRY ? '0 (simulation)' : inserted} inséré(s).`)
