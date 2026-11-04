import * as cheerio from 'cheerio'
import { PlaquetteError } from './types'

/**
 * Session sur mytransak.transakauto.com via le bouton « Se connecter avec
 * Seenaps » : mytransak renvoie vers l'IdP SAML (transakauto.seenaps.fr), on y
 * poste l'identifiant et le mot de passe, l'IdP répond par un formulaire
 * auto-soumis (SAMLResponse) que l'on poste à son tour sur /saml/acs. Le cookie
 * PHPSESSID obtenu ouvre ensuite toutes les pages du back-office.
 *
 * Tout se fait en HTTP pur (fetch + pot à cookies maison) : aucun navigateur à
 * embarquer, ce qui tient dans une fonction Vercel.
 */
export const MYTRANSAK_BASE = 'https://mytransak.transakauto.com'

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'

/** Durée de réutilisation d'une session avant reconnexion préventive. */
const SESSION_TTL_MS = 4 * 60 * 60 * 1000

class CookieJar {
  private readonly byHost = new Map<string, Map<string, string>>()

  absorb(url: string, response: Response) {
    const list = response.headers.getSetCookie?.() ?? []
    if (!list.length) return
    const host = new URL(url).host
    const jar = this.byHost.get(host) ?? new Map<string, string>()
    for (const raw of list) {
      const pair = raw.split(';')[0]
      const eq = pair.indexOf('=')
      if (eq <= 0) continue
      jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim())
    }
    this.byHost.set(host, jar)
  }

  header(url: string): string | undefined {
    const jar = this.byHost.get(new URL(url).host)
    if (!jar?.size) return undefined
    return [...jar].map(([name, value]) => `${name}=${value}`).join('; ')
  }
}

interface Hop {
  status: number
  url: string
  body: string
}

interface FollowOptions {
  method?: 'GET' | 'POST'
  form?: Record<string, string>
  referer?: string
}

/** fetch avec suivi manuel des redirections, pour capturer les cookies à chaque saut. */
async function follow(jar: CookieJar, url: string, options: FollowOptions = {}): Promise<Hop> {
  let method = options.method ?? 'GET'
  let body = options.form ? new URLSearchParams(options.form).toString() : undefined
  let current = url

  for (let i = 0; i < 12; i++) {
    const headers: Record<string, string> = {
      'User-Agent': UA,
      Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9',
    }
    const cookie = jar.header(current)
    if (cookie) headers.Cookie = cookie
    if (options.referer) headers.Referer = options.referer
    if (body !== undefined) headers['Content-Type'] = 'application/x-www-form-urlencoded'

    let response: Response
    try {
      response = await fetch(current, {
        method,
        headers,
        body,
        redirect: 'manual',
        signal: AbortSignal.timeout(45_000),
      })
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      throw new PlaquetteError(`${new URL(current).host} ne répond pas (${reason})`, 'upstream')
    }
    jar.absorb(current, response)

    // Seenaps répond 302 sans Location mais avec le formulaire SAMLResponse dans
    // le corps : un 3xx sans destination est donc une réponse finale.
    const location = response.headers.get('location')
    if ([301, 302, 303, 307, 308].includes(response.status) && location) {
      await response.arrayBuffer()
      if (response.status !== 307 && response.status !== 308) {
        method = 'GET'
        body = undefined
      }
      current = new URL(location, current).toString()
      continue
    }

    return { status: response.status, url: current, body: await response.text() }
  }

  throw new PlaquetteError('Trop de redirections pendant la connexion à mytransak', 'upstream')
}

function extractForm(html: string, mustContain: string): { action: string; fields: Record<string, string> } | null {
  const $ = cheerio.load(html)
  const form = $('form')
    .filter((_, element) => $(element).find(mustContain).length > 0)
    .first()
  if (!form.length) return null

  const fields: Record<string, string> = {}
  form.find('input[name]').each((_, element) => {
    fields[$(element).attr('name')!] = $(element).attr('value') ?? ''
  })
  return { action: form.attr('action') ?? '', fields }
}

function isLoginPage(hop: Hop): boolean {
  return /\/login(\?|$)/.test(hop.url) || /name="_username"/.test(hop.body) || /name="password"/.test(hop.body)
}

async function login(): Promise<CookieJar> {
  const email = process.env.MYTRANSAK_EMAIL
  const password = process.env.MYTRANSAK_PASSWORD
  if (!email || !password) {
    throw new PlaquetteError('MYTRANSAK_EMAIL et MYTRANSAK_PASSWORD doivent être renseignés', 'config')
  }

  const jar = new CookieJar()

  // 1. mytransak → IdP Seenaps (formulaire identifiant / mot de passe).
  const idp = await follow(jar, `${MYTRANSAK_BASE}/saml/login`)
  if (idp.status >= 500) {
    throw new PlaquetteError(`mytransak est indisponible pour le moment (HTTP ${idp.status}) : réessayez plus tard`, 'upstream')
  }
  const loginForm = extractForm(idp.body, 'input[name="password"]')
  if (!loginForm) throw new PlaquetteError(`Page de connexion Seenaps inattendue (HTTP ${idp.status} sur ${new URL(idp.url).host})`, 'upstream')

  // 2. Identifiants → l'IdP renvoie le formulaire SAMLResponse auto-soumis.
  const back = await follow(jar, new URL(loginForm.action || idp.url, idp.url).toString(), {
    method: 'POST',
    form: { ...loginForm.fields, username: email, password },
    referer: idp.url,
  })
  const acsForm = extractForm(back.body, 'input[name="SAMLResponse"]')
  if (!acsForm) throw new PlaquetteError('Connexion Seenaps refusée : vérifiez MYTRANSAK_EMAIL / MYTRANSAK_PASSWORD', 'auth')

  // 3. SAMLResponse → mytransak ouvre la session (cookie PHPSESSID).
  const landed = await follow(jar, new URL(acsForm.action, back.url).toString(), {
    method: 'POST',
    form: acsForm.fields,
    referer: back.url,
  })
  if (isLoginPage(landed)) throw new PlaquetteError("mytransak n'a pas ouvert de session après Seenaps", 'auth')

  return jar
}

let session: { jar: CookieJar; openedAt: number } | null = null
let pending: Promise<CookieJar> | null = null

/** Session partagée par les appels successifs ; reconnexion si elle est trop vieille. */
async function getJar(force = false): Promise<CookieJar> {
  if (!force && session && Date.now() - session.openedAt < SESSION_TTL_MS) return session.jar
  if (!pending) {
    pending = login()
      .then((jar) => {
        session = { jar, openedAt: Date.now() }
        return jar
      })
      .finally(() => {
        pending = null
      })
  }
  return pending
}

/** Page HTML du back-office (chemin relatif à mytransak), avec reconnexion si la session a expiré. */
export async function fetchMytransakPage(path: string): Promise<string> {
  const url = path.startsWith('http') ? path : `${MYTRANSAK_BASE}${path}`
  let hop = await follow(await getJar(), url)
  if (isLoginPage(hop)) hop = await follow(await getJar(true), url)
  if (isLoginPage(hop)) throw new PlaquetteError('Impossible de rester connecté à mytransak', 'auth')
  if (hop.status === 404) throw new PlaquetteError('Mandat introuvable sur mytransak (404)', 'notfound')
  if (hop.status >= 400) throw new PlaquetteError(`mytransak a répondu ${hop.status} sur ${path}`, 'upstream')
  return hop.body
}

/** Fichier (photo) ; les cookies de session sont envoyés si l'URL est sur mytransak. */
export async function fetchMytransakBinary(url: string): Promise<Buffer> {
  const headers: Record<string, string> = { 'User-Agent': UA }
  const cookie = (await getJar()).header(url)
  if (cookie) headers.Cookie = cookie
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(30_000) })
  if (!response.ok) throw new PlaquetteError(`Téléchargement impossible (${response.status}) : ${url}`, 'upstream')
  return Buffer.from(await response.arrayBuffer())
}
