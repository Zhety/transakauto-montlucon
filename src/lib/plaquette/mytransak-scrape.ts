import * as cheerio from 'cheerio'
import type { Cheerio, CheerioAPI } from 'cheerio'
import type { AnyNode } from 'domhandler'
import { MYTRANSAK_BASE } from './mytransak-auth'
import { PlaquetteError, type EquipmentGroup, type MandatePhoto, type VehicleDossier } from './types'

/** Accepte l'URL complète ou le chemin de n'importe quel onglet du mandat. */
export function parseMandateUrl(input: string): { shop: string; id: string } {
  const match = /\/(shop-[a-z0-9-]+)\/mandat\/(\d+)/i.exec(input.trim())
  if (!match) {
    throw new PlaquetteError(
      'Lien non reconnu : collez un lien de fiche mandat mytransak (…/shop-xxx/mandat/12345/…)',
      'input',
    )
  }
  return { shop: match[1], id: match[2] }
}

const clean = (text: string) => text.replace(/\s+/g, ' ').trim()

/** « 26 990,00 € » → 26990 ; « - » → null. */
export function parseEuro(text: string | undefined): number | null {
  if (!text) return null
  const match = /-?\d[\d\s .]*(?:,\d+)?/.exec(text)
  if (!match) return null
  const value = Number(match[0].replace(/[\s .]/g, '').replace(',', '.'))
  return Number.isFinite(value) ? value : null
}

/** Bloc dont l'en-tête contient `label` : le conteneur direct du `.card-header` (pas toujours un `.card`). */
function cardByHeader($: CheerioAPI, label: string): Cheerio<AnyNode> {
  return $('.card-header')
    .filter((_, element) => clean($(element).text()).includes(label))
    .first()
    .parent()
}

function pairsOf($: CheerioAPI, scope: Cheerio<AnyNode>): Record<string, string> {
  const pairs: Record<string, string> = {}
  scope.find('dl .line').each((_, line) => {
    const key = clean($(line).find('dt').first().text())
    const value = clean($(line).find('dd').first().text())
    if (key) pairs[key] = value
  })
  return pairs
}

function parseDetails(html: string, shop: string, id: string, sourceUrl: string) {
  const $ = cheerio.load(html)
  const title = clean($('h1').first().text())
  if (!title) throw new PlaquetteError('Fiche mandat illisible : titre absent (page de connexion ?)', 'upstream')

  const tag = clean($('.mandat-tag').first().text())
  const [make = '', model = ''] = tag.split('/').map(clean)

  const about = pairsOf($, cardByHeader($, 'A propos du mandat'))
  const info = pairsOf($, cardByHeader($, 'Informations du véhicule'))
  const registration = pairsOf($, cardByHeader($, 'carte grise'))

  const stats: Record<string, string> = {}
  $('.mandat-stats .stat').each((_, stat) => {
    const label = clean($(stat).find('.label').text())
    const value = clean($(stat).find('.value').text())
    if (label) stats[label] = value
  })

  const refMatch = /[A-Z]{2}\d{4,}/.exec(about['Référence'] ?? '')
  // La cellule « Commercial » commence par les initiales de l'avatar (« GH Gabriel HADDAD »).
  const commercialRaw = about['Commercial'] ?? ''
  const commercial = clean(commercialRaw.replace(/^[A-Z]{1,3}\s+(?=[A-Za-zÀ-ÿ])/, '')) || null

  const listing = $('a[href*="annonces.transakauto.com/vehicule/"]').first().attr('href') ?? null

  return {
    shop,
    mandateId: id,
    sourceUrl,
    ref: refMatch?.[0] ?? `M${id}`,
    title,
    make: make || registration['Marque (D.1)'] || '',
    model: model || registration['Nom commercial (D.3)'] || '',
    agency: about['Agence'] ?? '',
    commercial,
    priceEur: parseEuro(about['Prix de vente']),
    feesEur: parseEuro(about["Frais d'intermédiation"]),
    roadFeesEur: null,
    info,
    stats,
    registration,
    listingUrl: listing,
  }
}

function parsePhotos(html: string): MandatePhoto[] {
  const $ = cheerio.load(html)
  const photos: MandatePhoto[] = []
  $('.photo-item[data-photo-id]').each((index, element) => {
    const item = $(element)
    if (item.attr('data-active') === 'false') return
    const full = item.attr('data-full-url') ?? item.find('img').attr('src')?.replace(/\/vignette$/, '')
    if (!full) return
    const thumb = item.find('img').attr('src') ?? `${full}/vignette`
    photos.push({
      id: item.attr('data-photo-id')!,
      position: Number(item.attr('data-position') ?? index),
      fullUrl: new URL(full, MYTRANSAK_BASE).toString(),
      thumbUrl: new URL(thumb, MYTRANSAK_BASE).toString(),
    })
  })
  return photos.sort((a, b) => a.position - b.position)
}

function groupItems($: CheerioAPI, group: Cheerio<AnyNode>): string[] {
  const items: string[] = []
  group.find('input[name="options[]"]').each((_, input) => {
    const value = clean($(input).attr('value') ?? '')
    if (value && !items.includes(value)) items.push(value)
  })
  return items
}

function parseEquipment(html: string): Pick<VehicleDossier, 'savedOptions' | 'serie' | 'options'> {
  const $ = cheerio.load(html)
  const serie: EquipmentGroup[] = []
  const options: EquipmentGroup[] = []
  let savedOptions: string[] = []

  $('.option-group[data-group]').each((_, element) => {
    const group = $(element)
    const key = group.attr('data-group') ?? ''
    if (key === 'sans-groupe') {
      savedOptions = groupItems($, group)
      return
    }
    const prefix = key.startsWith('serie-') ? 'serie' : key.startsWith('special-') ? 'special' : null
    if (!prefix) return
    const name = clean(group.find('span.fw-semibold').first().text()).replace(/\s*\(\d+\)\s*$/, '')
    const items = groupItems($, group)
    if (!items.length) return
    ;(prefix === 'serie' ? serie : options).push({ key, name: !name || /sans groupe/i.test(name) ? 'Autres' : name, items })
  })

  return { savedOptions, serie, options }
}

/**
 * Assemble la fiche mandat à partir des onglets Informations, Photos et
 * Équipements. `fetchPage` reçoit un chemin relatif à mytransak.
 */
export async function scrapeMandate(
  shop: string,
  id: string,
  fetchPage: (path: string) => Promise<string>,
  sourceUrl = `${MYTRANSAK_BASE}/${shop}/mandat/${id}/details`,
): Promise<VehicleDossier> {
  const base = `/${shop}/mandat/${id}`
  const [detailsHtml, photosHtml, equipmentHtml] = await Promise.all([
    fetchPage(`${base}/details`),
    fetchPage(`${base}/photos/`),
    fetchPage(`${base}/equipements/`),
  ])

  const details = parseDetails(detailsHtml, shop, id, sourceUrl)
  const photos = parsePhotos(photosHtml)
  if (!photos.length) throw new PlaquetteError("Ce mandat n'a aucune photo : ajoutez-en avant de générer la plaquette", 'input')

  return { ...details, photos, ...parseEquipment(equipmentHtml) }
}
