import fs from 'node:fs'
import path from 'node:path'
import React from 'react'
import type * as Renderer from '@react-pdf/renderer'
import type { Style } from '@react-pdf/types'
import { SITE } from '@/lib/site'
import {
  DISCLAIMER,
  FEES_DETAIL,
  INCLUDED_WARRANTY_MONTHS,
  WARRANTY_TIERS,
  buildEquipment,
  buildSpecs,
  buildStats,
  formatEuro,
  type BrochureContent,
  type PhotoPick,
} from './content'
import type { PhotoAsset, VehicleDossier } from './types'

/**
 * Mise en page « magazine » (format C validé par l'agence) : couverture noire
 * avec la première photo du reportage en pleine largeur, pages intérieures
 * claires, rose Transakauto pour les accents. Pas de JSX : le module est un
 * simple module serveur, exécutable aussi hors de Next (script CLI).
 */
const h = React.createElement
const mm = (value: number) => (value * 72) / 25.4
const PAGE_W = 595.28
/** Hauteur A4 posée explicitement : sans elle, react-pdf ajuste la page au contenu. */
const PAGE_H = 841.89

/**
 * @react-pdf/renderer n'est publié qu'en ESM : importé à la demande, il se
 * charge aussi bien depuis Next que depuis le script CLI lancé avec tsx (qui
 * résout mal un import statique d'ESM depuis un module CommonJS).
 */
let Circle: typeof Renderer.Circle
let Defs: typeof Renderer.Defs
let Document: typeof Renderer.Document
let Font: typeof Renderer.Font
let Image: typeof Renderer.Image
let LinearGradient: typeof Renderer.LinearGradient
let Page: typeof Renderer.Page
let Path: typeof Renderer.Path
let Rect: typeof Renderer.Rect
let Stop: typeof Renderer.Stop
let Svg: typeof Renderer.Svg
let Text: typeof Renderer.Text
let View: typeof Renderer.View
let renderToBuffer: typeof Renderer.renderToBuffer

async function loadRenderer() {
  if (View) return
  const renderer = await import('@react-pdf/renderer')
  ;({ Circle, Defs, Document, Font, Image, LinearGradient, Page, Path, Rect, Stop, Svg, Text, View, renderToBuffer } = renderer)
}

const C = {
  ink: '#15171c',
  muted: '#6b6f78',
  line: '#e3e5ea',
  soft: '#f4f5f8',
  pink: '#e6007e',
  pinkLight: '#ff5fb4',
  night: '#0b0c10',
  nightSoft: '#181b24',
  nightLine: '#2a2d37',
  nightMuted: '#a2a6b1',
}

const FONT_DIR = path.join(process.cwd(), 'src', 'assets', 'fonts')
const LOGO_PATH = path.join(process.cwd(), 'public', 'transakauto-logo.png')

let fontsReady = false
function ensureFonts() {
  if (fontsReady) return
  const weights: [number, string][] = [
    [400, 'Regular'],
    [500, 'Medium'],
    [600, 'SemiBold'],
    [700, 'Bold'],
    [800, 'ExtraBold'],
  ]
  Font.register({
    family: 'Poppins',
    fonts: weights.map(([fontWeight, name]) => ({ src: path.join(FONT_DIR, `Poppins-${name}.ttf`), fontWeight })),
  })
  // Pas de césure : les libellés techniques coupés au milieu sont illisibles.
  Font.registerHyphenationCallback((word) => [word])
  fontsReady = true
}

let logoCache: Buffer | null = null
function logo(): Buffer {
  if (!logoCache) logoCache = fs.readFileSync(LOGO_PATH)
  return logoCache
}

const jpg = (data: Buffer) => ({ data, format: 'jpg' as const })

/* ------------------------------------------------------------------ gabarit */

function topBar(label: string) {
  return h(
    View,
    {
      style: {
        height: mm(16),
        backgroundColor: C.night,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: mm(14),
      },
    },
    h(Image, { src: { data: logo(), format: 'png' }, style: { width: mm(29), height: mm(9) } }),
    h(Text, { style: { color: '#ffffff', fontSize: 8.5, letterSpacing: 1.1, textTransform: 'uppercase', opacity: 0.85 } }, label),
  )
}

function footer() {
  return h(
    View,
    {
      style: {
        position: 'absolute',
        left: mm(14),
        right: mm(14),
        bottom: mm(8),
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: C.line,
        paddingTop: mm(2.5),
      },
    },
    h(
      Text,
      { style: { fontSize: 7.5, color: C.muted } },
      h(Text, { style: { fontWeight: 600, color: C.ink } }, SITE.name),
      ` · ${SITE.phoneDisplay}`,
    ),
    h(Text, {
      style: { fontSize: 7.5, color: C.muted },
      render: ({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) => `Page ${pageNumber} / ${totalPages}`,
    }),
  )
}

function innerPage(label: string, ...children: React.ReactNode[]) {
  return h(
    Page,
    // Pas de `wrap: false` ici : react-pdf ajusterait alors la page à son contenu.
    { size: 'A4', style: { width: PAGE_W, height: PAGE_H, fontFamily: 'Poppins', backgroundColor: '#ffffff', color: C.ink } },
    topBar(label),
    h(View, { style: { paddingTop: mm(10), paddingHorizontal: mm(14) } }, ...children),
    footer(),
  )
}

function sectionHead(kicker: string, title: string, lead?: string) {
  return h(
    View,
    { style: { marginBottom: mm(4.5) } },
    h(Text, { style: { color: C.pink, fontSize: 7.5, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: mm(1.5) } }, kicker),
    h(Text, { style: { fontSize: 16, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.2, lineHeight: 1.15 } }, title),
    lead ? h(Text, { style: { fontSize: 9, color: C.muted, marginTop: mm(1.2), lineHeight: 1.35 } }, lead) : null,
  )
}

/* ------------------------------------------------------------------- photos */

function caption(pick: PhotoPick) {
  if (!pick.title && !pick.caption) return null
  return h(
    Text,
    { style: { fontSize: 8.2, color: C.muted, marginTop: mm(1.6), lineHeight: 1.3 } },
    pick.title ? h(Text, { style: { fontWeight: 600, color: C.ink } }, pick.title + (pick.caption ? ' · ' : '')) : null,
    pick.caption,
  )
}

function photoGrid(picks: PhotoPick[], assets: PhotoAsset[], imageHeight: number) {
  return h(
    View,
    { style: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' } },
    ...picks.map((pick) => {
      const asset = assets[pick.photo - 1]
      if (!asset) return null
      return h(
        View,
        { key: String(pick.photo), style: { width: '48.6%', marginBottom: mm(3) } },
        h(Image, { src: jpg(asset.large), style: { width: '100%', height: imageHeight, objectFit: 'cover', borderRadius: mm(2) } }),
        caption(pick),
      )
    }),
  )
}

function checkIcon() {
  return h(
    Svg,
    { width: 13, height: 13, viewBox: '0 0 13 13', style: { marginTop: 1.5 } },
    h(Circle, { cx: 6.5, cy: 6.5, r: 6.5, fill: C.pink }),
    h(Path, { d: 'M3.6 6.7 L5.6 8.7 L9.4 4.6', stroke: '#ffffff', strokeWidth: 1.5, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }),
  )
}

/* ------------------------------------------------------------------- pages */

function coverPage(dossier: VehicleDossier, content: BrochureContent, assets: PhotoAsset[]) {
  const heroH = mm(186)
  const hero = assets[0]
  const stats = buildStats(dossier)
  const price = dossier.priceEur
  const fees = dossier.feesEur

  const statTile = (value: string, label: string) =>
    h(
      View,
      { key: label, style: { flex: 1, backgroundColor: C.nightSoft, borderRadius: mm(2), paddingVertical: mm(3), paddingHorizontal: mm(1.5), alignItems: 'center' } },
      h(Text, { style: { fontSize: 11.5, fontWeight: 700, color: '#ffffff' } }, value),
      h(Text, { style: { fontSize: 6.8, color: C.nightMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: mm(1.2) } }, label),
    )

  const priceRow = (label: string, value: string, last = false) =>
    h(
      View,
      {
        key: label,
        style: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingVertical: mm(1.5),
          borderBottomWidth: last ? 0 : 1,
          borderBottomColor: C.nightLine,
          borderBottomStyle: 'dashed',
        },
      },
      h(Text, { style: { fontSize: 8.8, color: '#ffffff', fontWeight: last ? 700 : 400 } }, label),
      h(Text, { style: { fontSize: 8.8, color: '#ffffff', fontWeight: last ? 700 : 400 } }, value),
    )

  const sideRows = price !== null
    ? [
        priceRow('Prix du véhicule', formatEuro(price), fees === null),
        ...(fees !== null ? [priceRow("Frais d'intermédiation", formatEuro(fees)), priceRow('Prix total (hors carte grise)', formatEuro(price + fees), true)] : []),
      ]
    : [priceRow('Prix', 'sur demande', true)]

  return h(
    Page,
    { size: 'A4', style: { width: PAGE_W, height: PAGE_H, fontFamily: 'Poppins', backgroundColor: C.night } },
    h(
      View,
      { style: { height: heroH, position: 'relative' } },
      hero
        ? h(Image, { src: jpg(hero.hero ?? hero.large), style: { position: 'absolute', top: 0, left: 0, width: PAGE_W, height: heroH, objectFit: 'cover' } })
        : null,
      h(
        Svg,
        { width: PAGE_W, height: heroH, viewBox: `0 0 ${PAGE_W} ${heroH}`, style: { position: 'absolute', top: 0, left: 0 } },
        h(
          Defs,
          null,
          h(
            LinearGradient,
            { id: 'shade', x1: '0%', y1: '0%', x2: '0%', y2: '100%' },
            h(Stop, { offset: '0%', stopColor: '#000000', stopOpacity: 0.62 }),
            h(Stop, { offset: '24%', stopColor: '#000000', stopOpacity: 0 }),
            h(Stop, { offset: '46%', stopColor: '#000000', stopOpacity: 0 }),
            h(Stop, { offset: '70%', stopColor: '#000000', stopOpacity: 0.72 }),
            h(Stop, { offset: '100%', stopColor: '#000000', stopOpacity: 0.97 }),
          ),
        ),
        h(Rect, { x: 0, y: 0, width: PAGE_W, height: heroH, fill: 'url(#shade)' }),
      ),
      h(Image, { src: { data: logo(), format: 'png' }, style: { position: 'absolute', top: mm(9), left: mm(14), width: mm(29), height: mm(9) } }),
      h(
        Text,
        { style: { position: 'absolute', top: mm(10.5), right: mm(14), color: '#ffffff', fontSize: 8.5, letterSpacing: 1.1, textTransform: 'uppercase', opacity: 0.9 } },
        agencyLabel(),
      ),
      h(
        View,
        { style: { position: 'absolute', left: mm(14), right: mm(14), bottom: mm(9) } },
        h(Text, { style: { color: C.pinkLight, fontSize: 7.5, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: mm(2) } }, `Véhicule d'occasion · Réf. ${dossier.ref}`),
        h(Text, { style: { color: '#ffffff', fontSize: 25, fontWeight: 800, textTransform: 'uppercase', lineHeight: 1.05, letterSpacing: 0.2 } }, content.headline),
        content.subtitle ? h(Text, { style: { color: '#ffffff', opacity: 0.85, fontSize: 11, fontWeight: 500, marginTop: mm(2.5), lineHeight: 1.3 } }, content.subtitle) : null,
      ),
    ),
    h(
      View,
      { style: { paddingHorizontal: mm(14), paddingTop: mm(7) } },
      stats.length ? h(View, { style: { flexDirection: 'row', gap: mm(2.5), marginBottom: mm(6) } }, ...stats.map((tile) => statTile(tile.value, tile.label))) : null,
      h(
        View,
        { style: { flexDirection: 'row', gap: mm(6) } },
        h(
          View,
          { style: { flex: 1, backgroundColor: C.pink, borderRadius: mm(2.5), paddingVertical: mm(6), paddingHorizontal: mm(7) } },
          h(Text, { style: { color: '#ffffff', fontSize: 8, textTransform: 'uppercase', letterSpacing: 1.2, opacity: 0.9, marginBottom: mm(2.5) } }, 'Prix de vente'),
          h(Text, { style: { color: '#ffffff', fontSize: 30, fontWeight: 800, lineHeight: 1 } }, price !== null ? formatEuro(price) : 'Sur demande'),
          h(
            Text,
            { style: { color: '#ffffff', fontSize: 8.2, marginTop: mm(3.5), lineHeight: 1.35, opacity: 0.95 } },
            `Hors carte grise · Garantie ${INCLUDED_WARRANTY_MONTHS} mois incluse, extensible jusqu'à 24 mois`,
          ),
        ),
        h(
          View,
          { style: { flex: 1.25, borderWidth: 1, borderColor: C.nightLine, borderRadius: mm(2.5), paddingVertical: mm(5), paddingHorizontal: mm(6) } },
          ...sideRows,
          fees !== null
            ? h(Text, { style: { fontSize: 7.4, color: C.nightMuted, marginTop: mm(2.5), lineHeight: 1.35 } }, `Les frais d'intermédiation comprennent : ${FEES_DETAIL}.`)
            : null,
        ),
      ),
      h(Text, { style: { fontSize: 7.3, color: '#8f93a0', marginTop: mm(4), lineHeight: 1.35 } }, DISCLAIMER),
    ),
  )
}

function highlightsPage(label: string, dossier: VehicleDossier, content: BrochureContent, assets: PhotoAsset[]) {
  const items = content.highlights.slice(0, 8)
  return innerPage(
    label,
    sectionHead("L'essentiel", `Les points forts de ce ${dossier.model.length <= 3 ? dossier.model : dossier.model.charAt(0) + dossier.model.slice(1).toLowerCase()}`, content.intro),
    photoGrid(content.featured, assets, mm(62)),
    items.length
      ? h(
          View,
          { style: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: mm(3) } },
          ...items.map((item, index) =>
            h(
              View,
              {
                key: String(index),
                style: { width: '48.6%', flexDirection: 'row', gap: mm(2.5), paddingVertical: mm(2.2), borderBottomWidth: 1, borderBottomColor: C.line },
              },
              checkIcon(),
              h(
                View,
                { style: { flex: 1 } },
                h(Text, { style: { fontSize: 9, fontWeight: 600, lineHeight: 1.25 } }, item.title),
                item.detail ? h(Text, { style: { fontSize: 7.8, color: C.muted, lineHeight: 1.3 } }, item.detail) : null,
              ),
            ),
          ),
        )
      : null,
  )
}

function galleryPage(label: string, kicker: string, title: string, lead: string, picks: PhotoPick[], assets: PhotoAsset[]) {
  return innerPage(label, sectionHead(kicker, title, lead || undefined), photoGrid(picks, assets, mm(64)))
}

function specsPage(label: string, dossier: VehicleDossier) {
  const columns = buildSpecs(dossier)
  const equipment = buildEquipment(dossier)
  const options = equipment.options.slice(0, 12)

  const specColumn = (title: string, rows: { label: string; value: string }[]) =>
    h(
      View,
      { key: title, style: { flex: 1 } },
      h(Text, { style: { fontSize: 8.4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: C.pink, borderBottomWidth: 1.5, borderBottomColor: C.pink, paddingBottom: mm(1.5), marginBottom: mm(1.5) } }, title),
      ...rows.map((row) =>
        h(
          View,
          { key: row.label, style: { flexDirection: 'row', paddingVertical: mm(1.1), borderBottomWidth: 1, borderBottomColor: C.line } },
          h(Text, { style: { width: '44%', fontSize: 7.6, color: C.muted, paddingRight: mm(1.5), lineHeight: 1.25 } }, row.label),
          h(Text, { style: { flex: 1, fontSize: 7.6, fontWeight: 600, lineHeight: 1.25 } }, row.value),
        ),
      ),
    )

  // Dotation en trois colonnes : chaque groupe va dans la colonne la moins
  // remplie, et la liste est plafonnée pour tenir sur la page.
  const MAX_PER_GROUP = 10
  const MAX_ITEMS = 54
  let budget = MAX_ITEMS
  const groups = equipment.serie
    .map((group) => {
      const items = group.items.slice(0, Math.min(MAX_PER_GROUP, budget))
      budget -= items.length
      return { name: group.name, items }
    })
    .filter((group) => group.items.length > 0)
  const cost = (group: { name: string; items: string[] }) => 1.8 + group.items.reduce((sum, item) => sum + Math.ceil(item.length / 36), 0)
  // Dotation fournie : on resserre un peu la typographie pour rester sur la page.
  const dense = groups.reduce((sum, group) => sum + group.items.length, 0) > 36
  const itemFont = dense ? 6.8 : 7.2
  const columnsOfGroups: (typeof groups)[] = [[], [], []]
  const heights = [0, 0, 0]
  for (const group of groups) {
    const column = heights.indexOf(Math.min(...heights))
    columnsOfGroups[column].push(group)
    heights[column] += cost(group)
  }

  return innerPage(
    label,
    sectionHead('Caractéristiques', 'Fiche technique', "Données issues du certificat d'immatriculation et du dossier véhicule."),
    h(View, { style: { flexDirection: 'row', gap: mm(6) } }, ...columns.map((column) => specColumn(column.title, column.rows))),
    options.length
      ? h(
          View,
          {
            style: {
              flexDirection: 'row',
              alignItems: 'center',
              gap: mm(4),
              backgroundColor: C.night,
              borderLeftWidth: mm(1.2),
              borderLeftColor: C.pink,
              borderRadius: mm(2.5),
              paddingVertical: mm(3.5),
              paddingHorizontal: mm(6),
              marginTop: mm(4),
            },
          },
          h(
            View,
            { style: { width: mm(36) } },
            h(Text, { style: { color: C.pink, fontSize: 8.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2 } }, 'Options'),
            h(Text, { style: { color: '#cfd2d9', fontSize: 7.4, marginTop: mm(1) } }, 'en plus de la dotation de série'),
          ),
          h(
            View,
            { style: { flex: 1, flexDirection: 'row', flexWrap: 'wrap' } },
            ...options.map((item) =>
              h(
                Text,
                { key: item, style: { width: '50%', color: '#ffffff', fontSize: 8, paddingRight: mm(3), marginBottom: mm(1), lineHeight: 1.3 } },
                h(Text, { style: { color: C.pink, fontWeight: 800 } }, '+ '),
                item,
              ),
            ),
          ),
        )
      : null,
    groups.length
      ? h(
          View,
          { style: { marginTop: mm(4) } },
          h(Text, { style: { color: C.pink, fontSize: 7.5, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: mm(1) } }, 'Dotation'),
          h(Text, { style: { fontSize: 12.5, fontWeight: 700, textTransform: 'uppercase', marginBottom: mm(2) } }, 'Équipements de série'),
          h(
            View,
            { style: { flexDirection: 'row', gap: mm(6) } },
            ...columnsOfGroups.map((groupList, index) =>
              h(
                View,
                { key: String(index), style: { flex: 1 } },
                ...groupList.map((group) =>
                  h(
                    View,
                    { key: group.name, style: { marginBottom: mm(dense ? 1.8 : 2.5) } },
                    h(Text, { style: { fontSize: dense ? 7.4 : 7.8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: mm(0.8) } }, group.name),
                    ...group.items.map((item) =>
                      h(
                        View,
                        { key: item, style: { flexDirection: 'row', marginBottom: mm(dense ? 0.3 : 0.4) } },
                        h(Text, { style: { width: mm(2.6), fontSize: itemFont, color: C.pink } }, '•'),
                        h(Text, { style: { flex: 1, fontSize: itemFont, lineHeight: 1.28 } }, item),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        )
      : null,
  )
}

function allPhotosPage(label: string, assets: PhotoAsset[]) {
  const shown = assets.slice(0, 54)
  const lead =
    shown.length < assets.length
      ? `${shown.length} des ${assets.length} photos du reportage · les autres sont disponibles sur demande.`
      : `${assets.length} photos prises à l'agence · photos en haute définition disponibles sur demande.`
  return innerPage(
    label,
    sectionHead('Galerie complète', 'Toutes les photos', lead),
    h(
      View,
      { style: { flexDirection: 'row', flexWrap: 'wrap' } },
      ...shown.map((asset, index) =>
        h(Image, {
          key: asset.id,
          src: jpg(asset.thumb),
          // 6 par ligne, marges explicites : la dernière ligne reste alignée à gauche.
          style: {
            width: mm((182 - 5 * 1.6) / 6),
            height: mm(21.5),
            objectFit: 'cover',
            borderRadius: mm(1.2),
            marginBottom: mm(1.6),
            marginRight: index % 6 === 5 ? 0 : mm(1.6),
          },
        }),
      ),
    ),
  )
}

function warrantyPage(label: string, dossier: VehicleDossier, content: BrochureContent) {
  const tier = WARRANTY_TIERS[content.warranty.tier]
  const address = `${SITE.address.street}, ${SITE.address.postalCode} ${SITE.address.city}`
  const feesText = dossier.feesEur !== null ? formatEuro(dossier.feesEur) : null
  const legal = [
    dossier.priceEur !== null ? `Prix de ${formatEuro(dossier.priceEur)} hors carte grise.` : null,
    feesText ? `Frais d'intermédiation à la charge de l'acheteur : ${feesText} (${FEES_DETAIL}).` : null,
    dossier.priceEur !== null && dossier.feesEur !== null ? `Prix total en cas d'acquisition : ${formatEuro(dossier.priceEur + dossier.feesEur)} hors carte grise.` : null,
    DISCLAIMER,
    'Conditions générales de prestations disponibles en agence et sur annonces.transakauto.com.',
    `${SITE.legalName}, ${SITE.rcs}.`,
  ]
    .filter(Boolean)
    .join(' ')

  const services = [
    'Paiement sécurisé par virement via plateforme dédiée',
    'Accompagnement carte grise et formalités administratives',
    'Livraison possible dans toute la France',
    'Véhicule nettoyé intérieur et extérieur par un préparateur',
    "Factures d'entretien et historique consultables en agence",
    "Large choix de véhicules d'occasion en agence",
  ]

  return innerPage(
    label,
    sectionHead('Sérénité', 'Garantie & services', `Une garantie mécanique de ${INCLUDED_WARRANTY_MONTHS} mois est comprise dans les frais d'intermédiation. Vous pouvez l'étendre dès l'achat du véhicule.`),
    h(
      View,
      { style: { flexDirection: 'row', alignItems: 'center', gap: mm(4), backgroundColor: C.soft, borderRadius: mm(2.5), paddingVertical: mm(4.5), paddingHorizontal: mm(5), marginBottom: mm(6) } },
      h(Text, { style: { fontSize: 14, fontWeight: 800, color: C.pink } }, `${INCLUDED_WARRANTY_MONTHS} mois inclus`),
      h(Text, { style: { flex: 1, fontSize: 8.8, lineHeight: 1.35 } }, "Garantie moteur, boîte et pont comprise dans les frais d'intermédiation (voir conditions en agence)."),
    ),
    h(Text, { style: { fontSize: 10.5, fontWeight: 700 } }, 'Extension de garantie pour ce véhicule'),
    h(Text, { style: { fontSize: 7.8, color: C.muted, marginTop: mm(0.8), marginBottom: mm(3) } }, `Grille « ${tier.label} » : ${content.warranty.reason || tier.criteria.toLowerCase()}.`),
    h(
      View,
      { style: { flexDirection: 'row', gap: mm(5) } },
      ...tier.prices.map((offer, index) =>
        h(
          View,
          {
            key: String(offer.months),
            style: {
              flex: 1,
              borderWidth: index === 1 ? 2 : 1,
              borderColor: index === 1 ? C.pink : C.line,
              borderRadius: mm(2.5),
              paddingVertical: mm(5),
              paddingHorizontal: mm(3),
              alignItems: 'center',
            },
          },
          h(Text, { style: { fontSize: 8.5, textTransform: 'uppercase', letterSpacing: 1, color: C.muted, fontWeight: 600 } }, `${offer.months} mois`),
          h(Text, { style: { fontSize: 21, fontWeight: 800, color: C.pink, marginVertical: mm(1.5) } }, formatEuro(offer.price)),
          h(Text, { style: { fontSize: 7.6, color: C.muted } }, `soit ${offer.months + INCLUDED_WARRANTY_MONTHS} mois de garantie au total`),
        ),
      ),
    ),
    h(Text, { style: { fontSize: 7.5, color: C.muted, marginTop: mm(3.5) } }, "Tarifs indicatifs, extension souscrite lors de l'achat. Conditions de garantie disponibles en agence."),
    h(
      View,
      { style: { flexDirection: 'row', gap: mm(6), marginTop: mm(10) } },
      h(
        View,
        { style: { flex: 1.3, backgroundColor: C.night, borderRadius: mm(2.5), paddingVertical: mm(6), paddingHorizontal: mm(7) } },
        h(Image, { src: { data: logo(), format: 'png' }, style: { width: mm(19.5), height: mm(6), marginBottom: mm(2.5) } }),
        h(Text, { style: { color: C.pink, fontSize: 14.5, fontWeight: 800 } }, SITE.phoneDisplay),
        h(Text, { style: { color: '#d9dbe2', fontSize: 8.8, marginTop: mm(1) } }, SITE.email),
        h(Text, { style: { color: '#d9dbe2', fontSize: 8.8, marginTop: mm(1), lineHeight: 1.35 } }, h(Text, { style: { color: '#ffffff', fontWeight: 600 } }, SITE.name), ` · ${address}`),
        dossier.commercial ? h(Text, { style: { color: '#d9dbe2', fontSize: 8.8, marginTop: mm(1) } }, 'Votre conseiller : ', h(Text, { style: { color: '#ffffff', fontWeight: 600 } }, dossier.commercial)) : null,
        h(Text, { style: { color: '#b9bcc6', fontSize: 8, marginTop: mm(3), lineHeight: 1.35 } }, `Véhicule en dépôt-vente, visible uniquement sur rendez-vous à l'agence. ${SITE.hours}.`),
      ),
      h(
        View,
        { style: { flex: 1 } },
        ...services.map((service) =>
          h(
            View,
            { key: service, style: { flexDirection: 'row', paddingVertical: mm(2.2), borderBottomWidth: 1, borderBottomColor: C.line } },
            h(Text, { style: { width: mm(3.5), color: C.pink, fontSize: 8.2, fontWeight: 800 } }, '•'),
            h(Text, { style: { flex: 1, fontSize: 8.2, lineHeight: 1.3 } }, service),
          ),
        ),
      ),
    ),
    h(Text, { style: { fontSize: 6.8, color: C.muted, marginTop: mm(8), lineHeight: 1.3 } }, legal),
  )
}

/* --------------------------------------------------------------- document */

/** « Agence de Montluçon », « Agence d'Aubière » : élision devant une voyelle. */
function agencyLabel(): string {
  const city = SITE.address.city
  return /^[aeiouyàâäéèêëîïôöùûüh]/i.test(city) ? `Agence d'${city}` : `Agence de ${city}`
}

export async function renderBrochurePdf(dossier: VehicleDossier, content: BrochureContent, assets: PhotoAsset[]): Promise<Buffer> {
  await loadRenderer()
  ensureFonts()
  const label = `${content.headline} · Réf. ${dossier.ref}`

  const document = h(
    Document,
    {
      title: `${content.headline} – ${SITE.name}`,
      author: SITE.name,
      subject: `Plaquette de présentation · Réf. ${dossier.ref}`,
      creator: `${SITE.name} · plaquette`,
      language: 'fr',
    },
    coverPage(dossier, content, assets),
    highlightsPage(label, dossier, content, assets),
    galleryPage(label, 'Galerie', 'Extérieur', content.exteriorLead, content.exterior, assets),
    galleryPage(label, 'Galerie', 'Intérieur & habitabilité', content.interiorLead, content.interior, assets),
    specsPage(label, dossier),
    allPhotosPage(label, assets),
    warrantyPage(label, dossier, content),
  )

  const buffer = await renderToBuffer(document as React.ReactElement<React.ComponentProps<typeof Document>>)
  return Buffer.from(buffer)
}

export type { Style }
