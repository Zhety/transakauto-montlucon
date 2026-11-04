'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { boardHref } from '@/lib/board-path'

const field =
  'w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[15px] text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-ink'

const STEPS = [
  'Connexion à mytransak',
  'Lecture de la fiche mandat',
  'Téléchargement des photos',
  'Rédaction du contenu par l’agent',
  'Mise en page du PDF',
]

type Result = { url: string; filename: string; agent: 'claude' | 'generique'; agentError: string | null }

function filenameFrom(response: Response, fallback: string): string {
  const header = response.headers.get('Content-Disposition') ?? ''
  const match = /filename="([^"]+)"/.exec(header)
  return match?.[1] ?? fallback
}

/**
 * Un lien de fiche mandat collé → la plaquette PDF se télécharge. La route ne
 * renvoie rien avant la fin : l'avancement affiché est indicatif (chronomètre
 * et étapes attendues), pas un état réel.
 */
export function PlaquetteForm({
  base,
  userName,
  agentConfigured,
  mytransakConfigured,
}: {
  base: string
  userName: string
  agentConfigured: boolean
  mytransakConfigured: boolean
}) {
  const [url, setUrl] = useState('')
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const previousUrl = useRef<string | null>(null)

  useEffect(() => {
    if (!running) return
    const started = Date.now()
    const timer = setInterval(() => setElapsed(Math.round((Date.now() - started) / 1000)), 1000)
    return () => clearInterval(timer)
  }, [running])

  // Libère le blob précédent quand un nouveau PDF le remplace.
  useEffect(() => {
    return () => {
      if (previousUrl.current) URL.revokeObjectURL(previousUrl.current)
    }
  }, [])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setRunning(true)
    setElapsed(0)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/board/plaquette', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { errors?: string[] }
        throw new Error(data.errors?.join(' · ') ?? `Erreur ${response.status}`)
      }

      const blob = await response.blob()
      if (previousUrl.current) URL.revokeObjectURL(previousUrl.current)
      const objectUrl = URL.createObjectURL(blob)
      previousUrl.current = objectUrl
      const filename = filenameFrom(response, 'plaquette.pdf')
      const agentError = response.headers.get('X-Plaquette-Agent-Error')

      setResult({
        url: objectUrl,
        filename,
        agent: response.headers.get('X-Plaquette-Agent') === 'claude' ? 'claude' : 'generique',
        agentError: agentError ? decodeURIComponent(agentError) : null,
      })

      // Téléchargement immédiat : l'utilisateur n'a plus qu'à l'envoyer.
      const anchor = document.createElement('a')
      anchor.href = objectUrl
      anchor.download = filename
      anchor.click()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Une erreur est survenue')
    } finally {
      setRunning(false)
    }
  }

  // Étape « attendue » d'après le temps écoulé : purement indicatif.
  const stepIndex = Math.min(STEPS.length - 1, elapsed < 3 ? 0 : elapsed < 8 ? 1 : elapsed < 25 ? 2 : elapsed < 80 ? 3 : 4)

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-line bg-card px-5 py-4">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Transakauto — Plaquette PDF</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted sm:block">{userName}</span>
          <Link
            href={boardHref(base, '')}
            className="rounded-full border border-line px-4 py-1.5 text-sm text-graphite transition-colors hover:border-ink hover:text-ink"
          >
            Leads
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-10">
        <form onSubmit={submit} className="rounded-2xl border border-line bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Créer la plaquette d’un véhicule</h2>
          <p className="mt-1 text-sm text-muted">
            Collez le lien de la fiche mandat sur mytransak (n’importe quel onglet). La plaquette reprend la première photo du
            reportage en couverture, les points forts, les photos, la fiche technique, les équipements, la galerie et la
            garantie, puis se télécharge.
          </p>

          {!mytransakConfigured && (
            <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              Les identifiants mytransak (MYTRANSAK_EMAIL / MYTRANSAK_PASSWORD) ne sont pas configurés sur ce déploiement.
            </p>
          )}
          {mytransakConfigured && !agentConfigured && (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Sans clé ANTHROPIC_API_KEY, la plaquette est générée avec un contenu générique : photos dans l’ordre du
              reportage, sans légendes ni points forts rédigés.
            </p>
          )}

          <label className="mt-5 block text-sm font-medium text-graphite" htmlFor="mandate-url">
            Lien de la fiche mandat
          </label>
          <input
            id="mandate-url"
            type="url"
            required
            placeholder="https://mytransak.transakauto.com/shop-montlucon-201/mandat/12345/details"
            className={`mt-1.5 ${field}`}
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            disabled={running}
          />

          <button
            type="submit"
            disabled={running || !mytransakConfigured}
            className="mt-6 w-full rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
          >
            {running ? `Génération en cours… ${elapsed}s` : 'Générer la plaquette'}
          </button>

          {running && (
            <ol className="mt-5 space-y-1.5 text-sm" aria-live="polite">
              {STEPS.map((step, index) => (
                <li
                  key={step}
                  className={
                    index < stepIndex
                      ? 'text-muted line-through'
                      : index === stepIndex
                        ? 'font-medium text-accent-ink'
                        : 'text-muted'
                  }
                >
                  {index === stepIndex ? '› ' : '  '}
                  {step}
                </li>
              ))}
              <li className="pt-1 text-xs text-muted">Comptez une à deux minutes selon le nombre de photos.</li>
            </ol>
          )}

          {error && (
            <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </p>
          )}

          {result && (
            <div className="mt-5 rounded-xl border border-line bg-paper px-4 py-4 text-sm">
              <p className="font-medium">Plaquette prête : {result.filename}</p>
              <p className="mt-1 text-muted">
                {result.agent === 'claude'
                  ? 'Photos choisies, légendes et points forts rédigés par l’agent.'
                  : result.agentError
                    ? `Contenu générique : l’agent n’a pas répondu (${result.agentError}).`
                    : 'Contenu générique (agent non configuré).'}
              </p>
              <a
                href={result.url}
                download={result.filename}
                className="mt-3 inline-block rounded-full border border-line px-4 py-1.5 text-sm text-graphite transition-colors hover:border-ink hover:text-ink"
              >
                Télécharger à nouveau
              </a>
            </div>
          )}
        </form>
      </main>
    </div>
  )
}
