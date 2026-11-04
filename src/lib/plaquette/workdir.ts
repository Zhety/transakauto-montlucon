import fs from 'node:fs/promises'
import path from 'node:path'
import type { LoadedDossier } from './build'
import { buildContactSheets } from './contact-sheet'
import { fallbackContent } from './content'
import type { PhotoAsset, VehicleDossier } from './types'

export interface WorkDir {
  dir: string
  dossierPath: string
  sheetPaths: string[]
  templatePath: string
}

/** Gabarit du contenu attendu de l'agent : mêmes champs que sa sortie, pré-remplis comme le repli générique. */
export function templateContent(dossier: VehicleDossier, assets: PhotoAsset[]) {
  const generic = fallbackContent(dossier, assets)
  return {
    headline: generic.headline,
    subtitle: generic.subtitle,
    intro: generic.intro,
    featured: generic.featured.map((p) => ({ photo: p.photo, title: p.title ?? '', caption: p.caption })),
    exteriorLead: '',
    exterior: generic.exterior.map((p) => ({ photo: p.photo, caption: p.caption })),
    interiorLead: '',
    interior: generic.interior.map((p) => ({ photo: p.photo, caption: p.caption })),
    highlights: generic.highlights,
    newPriceEstimateEur: null as number | null,
    isFourWheelDrive: false,
  }
}

/**
 * Dossier de travail d'une plaquette : la fiche en JSON, les photos en grand,
 * les planches-contact numérotées et le gabarit de contenu. C'est ce que lit
 * l'agent (Claude Code), que ce soit à la main ou depuis le service automatique.
 */
export async function prepareWorkDir(dir: string, { dossier, assets }: LoadedDossier): Promise<WorkDir> {
  await fs.mkdir(path.join(dir, 'photos'), { recursive: true })

  const dossierPath = path.join(dir, 'dossier.json')
  await fs.writeFile(dossierPath, JSON.stringify(dossier, null, 2))

  await Promise.all(
    assets.map((asset) => fs.writeFile(path.join(dir, 'photos', `${String(asset.position + 1).padStart(2, '0')}.jpg`), asset.large)),
  )

  const sheets = await buildContactSheets(assets)
  const sheetPaths = await Promise.all(
    sheets.map(async (sheet, index) => {
      const file = path.join(dir, `planche-${index + 1}.jpg`)
      await fs.writeFile(file, sheet)
      return file
    }),
  )

  const templatePath = path.join(dir, 'contenu-modele.json')
  await fs.writeFile(templatePath, JSON.stringify(templateContent(dossier, assets), null, 2))

  return { dir, dossierPath, sheetPaths, templatePath }
}
