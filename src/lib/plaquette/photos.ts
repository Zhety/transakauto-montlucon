import sharp from 'sharp'
import type { MandatePhoto, PhotoAsset } from './types'

const LARGE_WIDTH = 1100
const THUMB_WIDTH = 360
const HERO_WIDTH = 1500

/** Exécute `worker` sur chaque élément avec au plus `limit` tâches en parallèle, en gardant l'ordre. */
async function mapLimit<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const index = next++
        results[index] = await worker(items[index])
      }
    }),
  )
  return results
}

/**
 * Télécharge les originaux (webp 1600 px) et les ramène en JPEG à deux
 * tailles : le PDF doit rester léger (une fonction Vercel renvoie au plus
 * quelques Mo) et l'agent n'a besoin que de vignettes.
 */
export async function loadPhotoAssets(
  photos: MandatePhoto[],
  fetchBinary: (url: string) => Promise<Buffer>,
): Promise<PhotoAsset[]> {
  return mapLimit(photos, 6, async (photo) => {
    const original = await fetchBinary(photo.fullUrl)
    const base = sharp(original).rotate()
    const [largeOut, thumb] = await Promise.all([
      base
        .clone()
        .resize({ width: LARGE_WIDTH, withoutEnlargement: true })
        .jpeg({ quality: 76, mozjpeg: true })
        .toBuffer({ resolveWithObject: true }),
      base
        .clone()
        .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
        .jpeg({ quality: 72, mozjpeg: true })
        .toBuffer(),
    ])
    // La première photo du reportage est la couverture pleine page : plus nette.
    const hero =
      photo === photos[0]
        ? await base.clone().resize({ width: HERO_WIDTH, withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toBuffer()
        : undefined
    return { id: photo.id, position: photo.position, large: largeOut.data, thumb, hero, width: largeOut.info.width, height: largeOut.info.height }
  })
}
