/**
 * Plaquette PDF d'un mandat mytransak, depuis le terminal.
 *
 *   npm run plaquette -- <lien>                         PDF direct (API Claude si ANTHROPIC_API_KEY, sinon générique)
 *   npm run plaquette -- <lien> --preparer              fiche, photos et planches-contact dans plaquettes/<ref>/
 *   npm run plaquette -- <lien> --contenu <contenu.json> PDF à partir d'un contenu rédigé (agent local Claude Code)
 *
 * Options : [fichier.pdf] [--sans-agent] [--dossier <répertoire>]
 * Lit MYTRANSAK_EMAIL / MYTRANSAK_PASSWORD (/ ANTHROPIC_API_KEY) dans .env.local.
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { buildPlaquette, filenameFor, loadDossier } from '../src/lib/plaquette/build'
import { buildContactSheets } from '../src/lib/plaquette/contact-sheet'
import { fallbackContent } from '../src/lib/plaquette/content'

const args = process.argv.slice(2)
const positional: string[] = []
const flags = new Map<string, string | true>()
for (let i = 0; i < args.length; i++) {
  const arg = args[i]
  if (!arg.startsWith('--')) positional.push(arg)
  else if (['--contenu', '--dossier'].includes(arg)) flags.set(arg, args[++i] ?? '')
  else flags.set(arg, true)
}

const [input, output] = positional
if (!input) {
  console.error('Usage : npm run plaquette -- <lien mytransak> [fichier.pdf] [--preparer | --contenu <json>] [--sans-agent] [--dossier <répertoire>]')
  process.exit(1)
}

const started = Date.now()
const stamp = () => `[${((Date.now() - started) / 1000).toFixed(1)}s]`
const log = (step: string) => console.log(stamp(), step)

try {
  const loaded = await loadDossier(input, log)
  const { dossier, assets } = loaded
  const workDir = String(flags.get('--dossier') ?? path.join('plaquettes', dossier.ref))

  if (flags.get('--preparer')) {
    await fs.mkdir(path.join(workDir, 'photos'), { recursive: true })
    await fs.writeFile(path.join(workDir, 'dossier.json'), JSON.stringify(dossier, null, 2))
    await Promise.all(assets.map((asset) => fs.writeFile(path.join(workDir, 'photos', `${String(asset.position + 1).padStart(2, '0')}.jpg`), asset.large)))
    const sheets = await buildContactSheets(assets)
    await Promise.all(sheets.map((sheet, index) => fs.writeFile(path.join(workDir, `planche-${index + 1}.jpg`), sheet)))

    // Gabarit du contenu attendu : mêmes champs que la sortie de l'agent, pré-remplis à l'identique du repli.
    const generic = fallbackContent(dossier, assets)
    const template = {
      headline: generic.headline,
      subtitle: generic.subtitle,
      intro: generic.intro,
      featured: generic.featured.map((p) => ({ photo: p.photo, title: p.title ?? '', caption: p.caption })),
      exteriorLead: '',
      exterior: generic.exterior.map((p) => ({ photo: p.photo, caption: p.caption })),
      interiorLead: '',
      interior: generic.interior.map((p) => ({ photo: p.photo, caption: p.caption })),
      highlights: generic.highlights,
      newPriceEstimateEur: null,
      isFourWheelDrive: false,
    }
    await fs.writeFile(path.join(workDir, 'contenu-modele.json'), JSON.stringify(template, null, 2))

    log(`Dossier préparé dans ${workDir}/`)
    console.log(`  dossier.json          fiche mandat (${dossier.photos.length} photos, prix ${dossier.priceEur ?? '?'} €)`)
    console.log(`  planche-1..${sheets.length}.jpg       planches-contact numérotées (5 photos par ligne)`)
    console.log(`  photos/NN.jpg         photos en grand, NN = numéro de la photo`)
    console.log(`  contenu-modele.json   gabarit à remplir, puis : npm run plaquette -- "${input}" --contenu ${path.join(workDir, 'contenu.json')}`)
    process.exit(0)
  }

  let content: unknown
  const contentPath = flags.get('--contenu')
  if (typeof contentPath === 'string' && contentPath) {
    content = JSON.parse(await fs.readFile(contentPath, 'utf8'))
  }

  const result = await buildPlaquette(input, { loaded, content, skipAgent: Boolean(flags.get('--sans-agent')), log })
  const file = output ?? (content !== undefined ? path.join(workDir, filenameFor(dossier)) : result.filename)
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, result.pdf)

  log(`PDF écrit : ${file} (${(result.pdf.length / 1024 / 1024).toFixed(1)} Mo)`)
  log(
    result.agent === 'local'
      ? 'Contenu rédigé localement'
      : result.agent === 'claude'
        ? "Contenu rédigé par l'API Claude"
        : `Contenu générique${result.agentError ? ` (${result.agentError})` : ''}`,
  )
  log(`Garantie : grille ${result.content.warranty.tier} (${result.content.warranty.reason})`)
} catch (error) {
  console.error(stamp(), error instanceof Error ? error.message : error)
  process.exit(2)
}
