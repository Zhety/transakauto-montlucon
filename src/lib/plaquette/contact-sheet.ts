import sharp from 'sharp'
import type { PhotoAsset } from './types'

const COLS = 5
const CELL_W = 360
const CELL_H = 270
const GAP = 6
const PER_SHEET = 25

/**
 * Planches-contact numérotées (5 photos par ligne, 25 par planche) : c'est ce
 * que regarde l'agent local (Claude Code) pour choisir les photos et écrire les
 * légendes, au lieu d'ouvrir 44 fichiers un par un. Le numéro affiché est celui
 * attendu dans contenu.json (1 = première photo du reportage).
 */
export async function buildContactSheets(assets: PhotoAsset[]): Promise<Buffer[]> {
  const sheets: Buffer[] = []
  for (let start = 0; start < assets.length; start += PER_SHEET) {
    const chunk = assets.slice(start, start + PER_SHEET)
    const rows = Math.ceil(chunk.length / COLS)
    const width = COLS * CELL_W + (COLS + 1) * GAP
    const height = rows * CELL_H + (rows + 1) * GAP

    const layers = await Promise.all(
      chunk.map(async (asset, index) => {
        const col = index % COLS
        const row = Math.floor(index / COLS)
        const left = GAP + col * (CELL_W + GAP)
        const top = GAP + row * (CELL_H + GAP)
        const image = await sharp(asset.thumb).resize(CELL_W, CELL_H, { fit: 'cover' }).toBuffer()
        const label = Buffer.from(
          `<svg width="92" height="46"><rect width="92" height="46" fill="#000000"/>` +
            `<text x="12" y="35" font-family="Helvetica, Arial, sans-serif" font-size="32" font-weight="bold" fill="#ffffff">${asset.position + 1}</text></svg>`,
        )
        return [
          { input: image, left, top },
          { input: label, left: left + 4, top: top + 4 },
        ]
      }),
    )

    sheets.push(
      await sharp({ create: { width, height, channels: 3, background: '#ffffff' } })
        .composite(layers.flat())
        .jpeg({ quality: 82 })
        .toBuffer(),
    )
  }
  return sheets
}
