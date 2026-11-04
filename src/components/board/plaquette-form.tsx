'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { boardHref } from '@/lib/board-path'
import {
  PLAQUETTE_STATUS_LABELS,
  type PlaquetteQueueState,
  type PlaquetteRequest,
  type PlaquetteStatus,
  workerOnline,
} from '@/lib/plaquette/queue'

const field =
  'w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[15px] text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-ink'

const STATUS_STYLES: Record<PlaquetteStatus, string> = {
  en_attente: 'bg-paper text-graphite ring-1 ring-line',
  en_cours: 'bg-accent-soft text-accent-ink ring-1 ring-accent/30',
  prete: 'bg-[#34a853]/10 text-[#1e7e34] ring-1 ring-[#34a853]/30',
  erreur: 'bg-red-50 text-red-700 ring-1 ring-red-200',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function filenameFrom(response: Response, fallback: string): string {
  const match = /filename="([^"]+)"/.exec(response.headers.get('Content-Disposition') ?? '')
  return match?.[1] ?? fallback
}

function refFromUrl(url: string): string {
  const match = /\/mandat\/(\d+)/.exec(url)
  return match ? `mandat ${match[1]}` : url
}

/**
 * Deux façons d'obtenir une plaquette : la demande « rédigée », déposée dans la
 * file d'attente et traitée par Claude Code sur le Mac de l'agence (photos
 * choisies, légendes, points forts), ou la version « rapide », générique et
 * immédiate, produite par le site.
 */
export function PlaquetteForm({
  base,
  userName,
  initialQueue,
  mytransakConfigured,
}: {
  base: string
  userName: string
  initialQueue: PlaquetteQueueState
  mytransakConfigured: boolean
}) {
  const [url, setUrl] = useState('')
  const [queue, setQueue] = useState<PlaquetteQueueState>(initialQueue)
  const [submitting, setSubmitting] = useState(false)
  const [quickRunning, setQuickRunning] = useState(false)
  const [quickElapsed, setQuickElapsed] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [now, setNow] = useState<number | null>(null)
  const quickUrl = useRef<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/board/plaquette', { cache: 'no-store' })
      if (!response.ok) return
      const data = (await response.json()) as PlaquetteQueueState & { ok: boolean }
      if (data.ok) setQueue({ requests: data.requests, workerSeenAt: data.workerSeenAt, error: data.error })
    } catch {
      // Réseau indisponible : on garde l'état précédent, on réessaiera.
    }
  }, [])

  // Rafraîchissement : toutes les 5 s tant qu'une demande est en attente ou en cours, sinon toutes les 30 s.
  const active = queue.requests.some((request) => request.status === 'en_attente' || request.status === 'en_cours')
  useEffect(() => {
    const timer = setInterval(() => void refresh(), active ? 5000 : 30000)
    return () => clearInterval(timer)
  }, [active, refresh])

  useEffect(() => {
    setNow(Date.now())
    const timer = setInterval(() => setNow(Date.now()), 10000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!quickRunning) return
    const started = Date.now()
    const timer = setInterval(() => setQuickElapsed(Math.round((Date.now() - started) / 1000)), 1000)
    return () => clearInterval(timer)
  }, [quickRunning])

  async function request(mode: 'agent' | 'rapide') {
    const response = await fetch('/api/board/plaquette', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url.trim(), mode }),
    })
    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { errors?: string[] }
      throw new Error(data.errors?.join(' · ') ?? `Erreur ${response.status}`)
    }
    return response
  }

  async function submitAgent(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    setNotice(null)
    try {
      await request('agent')
      setNotice('Demande déposée. Le Mac de l’agence la traite dans les minutes qui viennent ; la plaquette apparaîtra ci-dessous.')
      setUrl('')
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Une erreur est survenue')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitQuick() {
    setQuickRunning(true)
    setQuickElapsed(0)
    setError(null)
    setNotice(null)
    try {
      const response = await request('rapide')
      const blob = await response.blob()
      if (quickUrl.current) URL.revokeObjectURL(quickUrl.current)
      const objectUrl = URL.createObjectURL(blob)
      quickUrl.current = objectUrl
      const anchor = document.createElement('a')
      anchor.href = objectUrl
      anchor.download = filenameFrom(response, 'plaquette.pdf')
      anchor.click()
      setNotice('Version rapide téléchargée (photos dans l’ordre, sans légendes).')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Une erreur est survenue')
    } finally {
      setQuickRunning(false)
    }
  }

  const online = now !== null && workerOnline(queue.workerSeenAt, now)
  const seenLabel =
    queue.workerSeenAt && now !== null ? `il y a ${Math.max(0, Math.round((now - Date.parse(queue.workerSeenAt)) / 60000))} min` : 'jamais'

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

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10">
        <form onSubmit={submitAgent} className="rounded-2xl border border-line bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Demander la plaquette d’un véhicule</h2>
              <p className="mt-1 text-sm text-muted">
                Collez le lien de la fiche mandat sur mytransak. L’agent du Mac de l’agence choisit les photos, rédige
                légendes et points forts, puis dépose le PDF ici. Comptez quelques minutes.
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${online ? STATUS_STYLES.prete : STATUS_STYLES.erreur}`}
              title={`Dernier signe de vie : ${seenLabel}`}
            >
              {now === null ? 'Agent du Mac' : online ? 'Agent du Mac connecté' : `Agent du Mac hors ligne (${seenLabel})`}
            </span>
          </div>

          {!mytransakConfigured && (
            <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              Les identifiants mytransak (MYTRANSAK_EMAIL / MYTRANSAK_PASSWORD) ne sont pas configurés sur ce déploiement : la
              version rapide est indisponible.
            </p>
          )}
          {queue.error && (
            <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {queue.error}
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
            disabled={submitting || quickRunning}
          />

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={submitting || quickRunning || !url.trim()}
              className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Envoi…' : 'Demander la plaquette rédigée'}
            </button>
            <button
              type="button"
              onClick={submitQuick}
              disabled={submitting || quickRunning || !url.trim() || !mytransakConfigured}
              className="rounded-full border border-line px-5 py-2.5 text-sm text-graphite transition-colors hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
              title="PDF immédiat produit par le site : photos dans l’ordre du reportage, sans légendes ni points forts"
            >
              {quickRunning ? `Version rapide… ${quickElapsed}s` : 'Version rapide, sans légendes'}
            </button>
          </div>

          {error && (
            <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </p>
          )}
          {notice && <p className="mt-5 rounded-xl border border-line bg-paper px-4 py-3 text-sm text-graphite">{notice}</p>}
        </form>

        <section className="mt-8">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">Dernières plaquettes</h2>
            <button type="button" onClick={() => void refresh()} className="text-sm text-muted hover:text-ink">
              Actualiser
            </button>
          </div>

          {queue.requests.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line px-5 py-8 text-center text-sm text-muted">
              Aucune demande pour l’instant.
            </p>
          ) : (
            <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
              {queue.requests.map((item) => (
                <RequestRow key={item.id} item={item} />
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}

function RequestRow({ item }: { item: PlaquetteRequest }) {
  const label = item.title ? `${item.title}${item.ref ? ` · ${item.ref}` : ''}` : refFromUrl(item.url)
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4">
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[item.status]}`}>
        {PLAQUETTE_STATUS_LABELS[item.status]}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{label}</p>
        <p className="text-xs text-muted">
          {formatDate(item.created_at)}
          {item.requested_by_name ? ` · ${item.requested_by_name}` : ''}
          {item.status === 'prete' && item.agent !== 'claude-code' ? ' · version générique' : ''}
        </p>
        {item.status === 'erreur' && item.error && <p className="mt-1 text-xs text-red-700">{item.error}</p>}
        {item.status === 'prete' && item.note && <p className="mt-1 text-xs text-muted">Agent indisponible : {item.note}</p>}
      </div>
      {item.status === 'prete' && item.download_url && (
        <a
          href={item.download_url}
          className="rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-white transition-transform hover:-translate-y-px"
        >
          Télécharger
        </a>
      )}
    </li>
  )
}
