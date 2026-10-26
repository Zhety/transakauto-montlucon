'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { boardHref } from '@/lib/board-path'
import { INTENT_LABELS, leadRows } from '@/lib/lead'
import {
  LEAD_STATUSES,
  type LeadNote,
  type LeadRow,
  type LeadStatus,
  type Member,
  memberName,
  leadOrigin,
  ORIGIN_LABELS,
  rowToLead,
} from '@/lib/leads-board'
import { createBrowserSupabase } from '@/lib/supabase'

/** Un véhicule non renseigné (lead Meta) ne doit pas afficher une ligne vide. */
function vehicleLabel(lead: LeadRow): string {
  return [lead.make, lead.model].filter(Boolean).join(' ') || 'Véhicule non précisé'
}

/** Année · kilométrage · code postal, en sautant ce qui manque. */
function summaryLine(lead: LeadRow): string {
  const parts = [
    lead.year == null ? null : String(lead.year),
    lead.mileage_km == null ? null : `${lead.mileage_km.toLocaleString('fr-FR')} km`,
    lead.postal_code,
  ].filter(Boolean)
  return parts.join(' · ') || '—'
}

const ORIGIN_STYLES: Record<string, string> = {
  meta: 'bg-[#0866ff]/10 text-[#0866ff]',
  google: 'bg-[#34a853]/10 text-[#1e7e34]',
  site: 'bg-ink/5 text-muted',
}

/** Champs que le tableau modifie depuis le navigateur. */
type LeadPatch = Partial<Pick<LeadRow, 'status' | 'assigned_to' | 'callback_at'>>

/**
 * Message lisible quand la base refuse une écriture. Deux cas connus : un
 * statut ajouté au code mais pas à l'enum `lead_status`, et une colonne ou une
 * table ajoutée au code (migration `supabase/migrations/*.sql`) mais pas encore
 * créée dans le projet Supabase.
 */
function describeDbError(cause: unknown, patch?: LeadPatch): string {
  const message =
    cause instanceof Error
      ? cause.message
      : typeof cause === 'object' && cause !== null && 'message' in cause
        ? String((cause as { message: unknown }).message)
        : String(cause)

  if (patch?.status && /invalid input value for enum lead_status/i.test(message)) {
    const label = LEAD_STATUSES.find((status) => status.key === patch.status)?.label ?? patch.status
    return `Le statut « ${label} » n'existe pas encore dans la base de données. Exécutez la migration supabase/migrations/004_statut_a_rappeler.sql dans Supabase → SQL Editor, puis réessayez.`
  }

  if (/schema cache/i.test(message)) {
    return `La base de données n'est pas à jour (${message}). Exécutez la migration supabase/migrations/005_notes_et_rappel.sql dans Supabase → SQL Editor, puis rechargez la page.`
  }

  return `La modification n'a pas été enregistrée : ${message}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

/** Date de rappel sur la fiche : « mar. 28 oct., 14:30 ». */
function formatCallback(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Valeur d'un <input type="datetime-local"> : heure locale, sans fuseau. */
function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

type CallbackTone = 'overdue' | 'today' | 'later'

/**
 * Rappel dépassé, prévu aujourd'hui, ou plus tard. `now` vaut null tant que le
 * navigateur n'a pas pris la main : le serveur rend sans état de retard.
 */
function callbackTone(iso: string, now: number | null): CallbackTone {
  if (now === null) return 'later'
  const date = new Date(iso)
  if (date.getTime() < now) return 'overdue'
  return date.toDateString() === new Date(now).toDateString() ? 'today' : 'later'
}

const CALLBACK_STYLES: Record<CallbackTone, string> = {
  overdue: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  today: 'bg-accent-soft text-accent-ink ring-1 ring-accent/30',
  later: 'bg-paper text-graphite ring-1 ring-line',
}

/** Colonne « À rappeler » : le prochain rappel en premier, les fiches sans date à la fin. */
function byCallback(a: LeadRow, b: LeadRow): number {
  const ta = a.callback_at ? Date.parse(a.callback_at) : Number.POSITIVE_INFINITY
  const tb = b.callback_at ? Date.parse(b.callback_at) : Number.POSITIVE_INFINITY
  return ta - tb
}

function initials(member: Member): string {
  return `${member.first_name.charAt(0)}${member.last_name?.charAt(0) ?? ''}`.toUpperCase()
}

const fieldCls = 'w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-ink'

/** Journal des appels d'une fiche : saisie, puis liste de la plus récente à la plus ancienne. */
function NotesPanel({
  notes,
  members,
  onAdd,
}: {
  notes: LeadNote[]
  members: Member[]
  onAdd: (body: string) => Promise<boolean>
}) {
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(event: React.SyntheticEvent) {
    event.preventDefault()
    if (!draft.trim() || saving) return
    setSaving(true)
    const saved = await onAdd(draft)
    setSaving(false)
    if (saved) setDraft('')
  }

  return (
    <section className="mt-5">
      <h3 className="text-sm font-medium">Notes d&apos;appel</h3>
      <form onSubmit={submit} className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-start">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            // Ctrl/Cmd + Entrée : enregistrer sans quitter le clavier.
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') void submit(event)
          }}
          rows={2}
          placeholder="Compte rendu de l'appel, prochaine étape…"
          className={fieldCls}
        />
        <button
          type="submit"
          disabled={saving || !draft.trim()}
          className="shrink-0 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
        >
          {saving ? 'Enregistrement…' : 'Ajouter'}
        </button>
      </form>

      {notes.length === 0 ? (
        <p className="mt-3 text-xs text-muted">Aucune note pour l&apos;instant.</p>
      ) : (
        <ol className="mt-3 space-y-2">
          {notes.map((note) => {
            const author = members.find((member) => member.id === note.author_id)
            return (
              <li key={note.id} className="rounded-lg border border-line bg-paper/60 px-3 py-2 text-sm">
                <p className="whitespace-pre-wrap">{note.body}</p>
                <p className="mt-1 text-xs text-muted">
                  {author ? memberName(author) : 'Compte supprimé'} · {formatDate(note.created_at)}
                </p>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}

export function LeadsBoard({
  initialLeads,
  initialNotes,
  members,
  current,
  base,
}: {
  initialLeads: LeadRow[]
  initialNotes: LeadNote[]
  members: Member[]
  current: { email: string; member: Member }
  /** '' sur leads.transakautomontlucon.com, '/board' sur le domaine principal. */
  base: string
}) {
  const router = useRouter()
  const [leads, setLeads] = useState(initialLeads)
  const [notes, setNotes] = useState(initialNotes)
  const [openId, setOpenId] = useState<string | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [overColumn, setOverColumn] = useState<LeadStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  /** Heure courante côté navigateur, rafraîchie chaque minute pour les rappels dépassés. */
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    setNow(Date.now())
    const timer = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(timer)
  }, [])

  const supabase = useMemo(() => createBrowserSupabase(), [])

  // Temps réel : une demande envoyée depuis le site, ou une note d'un collègue,
  // apparaît sans rafraîchir.
  useEffect(() => {
    const channel = supabase
      .channel('leads-board')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, (payload) => {
        setLeads((list) => [payload.new as LeadRow, ...list])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'leads' }, (payload) => {
        const updated = payload.new as LeadRow
        setLeads((list) => list.map((lead) => (lead.id === updated.id ? updated : lead)))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'leads' }, (payload) => {
        const removed = payload.old as Partial<LeadRow>
        setLeads((list) => list.filter((lead) => lead.id !== removed.id))
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lead_notes' }, (payload) => {
        const note = payload.new as LeadNote
        setNotes((list) => (list.some((item) => item.id === note.id) ? list : [note, ...list]))
      })
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [supabase])

  /** Notes par fiche, de la plus récente à la plus ancienne. */
  const notesByLead = useMemo(() => {
    const map = new Map<string, LeadNote[]>()
    for (const note of notes) {
      const list = map.get(note.lead_id)
      if (list) list.push(note)
      else map.set(note.lead_id, [note])
    }
    for (const list of map.values()) list.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    return map
  }, [notes])

  /**
   * Mise à jour optimiste : la fiche bouge tout de suite, la base suit. Si la
   * base refuse (statut inconnu de l'enum, droits, réseau), la fiche reprend sa
   * place et l'erreur s'affiche au lieu d'être perdue en silence — sans quoi la
   * fiche semblait déplacée puis revenait dans sa colonne au rechargement.
   */
  async function patchLead(id: string, patch: LeadPatch) {
    const previous = leads.find((lead) => lead.id === id)
    if (!previous) return

    const rollback: LeadPatch = {}
    for (const key of Object.keys(patch) as (keyof LeadPatch)[]) {
      ;(rollback as Record<string, unknown>)[key] = previous[key]
    }

    setError(null)
    setLeads((list) => list.map((lead) => (lead.id === id ? { ...lead, ...patch } : lead)))

    try {
      // `select` : sans lui, une mise à jour refusée par RLS répond « ok » avec
      // zéro ligne modifiée, et on ne saurait pas que rien n'a été enregistré.
      const { data, error: dbError } = await supabase.from('leads').update(patch).eq('id', id).select('id')
      if (dbError) throw dbError
      if (!data || data.length === 0) {
        throw new Error(
          'la base n\'a modifié aucune fiche. Session expirée ou compte absent de la table members : rechargez la page et reconnectez-vous.',
        )
      }
    } catch (cause) {
      // Détail complet dans la console du navigateur, pour le diagnostic.
      console.error('[leads-board] modification refusée', { id, patch, cause })
      setLeads((list) => list.map((lead) => (lead.id === id ? { ...lead, ...rollback } : lead)))
      setError(describeDbError(cause, patch))
    }
  }

  function setStatus(id: string, status: LeadStatus) {
    return patchLead(id, { status })
  }

  function setAssignee(id: string, assigned_to: string | null) {
    return patchLead(id, { assigned_to })
  }

  function setCallback(id: string, callback_at: string | null) {
    return patchLead(id, { callback_at })
  }

  /** Ajoute une note signée par l'utilisateur connecté ; renvoie false si la base refuse. */
  async function addNote(leadId: string, body: string): Promise<boolean> {
    setError(null)
    try {
      const { data, error: dbError } = await supabase
        .from('lead_notes')
        .insert({ lead_id: leadId, author_id: current.member.id, body: body.trim() })
        .select('*')
        .single()
      if (dbError) throw dbError
      const note = data as LeadNote
      // Le canal temps réel renvoie aussi la note : on ne l'ajoute qu'une fois.
      setNotes((list) => (list.some((item) => item.id === note.id) ? list : [note, ...list]))
      return true
    } catch (cause) {
      console.error('[leads-board] note refusée', { leadId, cause })
      setError(describeDbError(cause))
      return false
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.replace(boardHref(base, 'login'))
    router.refresh()
  }

  function dropOn(status: LeadStatus, event: React.DragEvent) {
    event.preventDefault()
    const id = event.dataTransfer.getData('text/plain') || dragId
    const lead = id ? leads.find((item) => item.id === id) : null
    if (lead && lead.status !== status) void setStatus(lead.id, status)
    setDragId(null)
    setOverColumn(null)
  }

  const open = leads.find((lead) => lead.id === openId) ?? null
  const openNotes = open ? (notesByLead.get(open.id) ?? []) : []
  const isAdmin = current.member.role === 'admin'

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-line bg-card px-5 py-4">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Transakauto — Leads</h1>
          <span className="text-sm text-muted">{leads.length} demandes</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted sm:block">{memberName(current.member)}</span>
          {isAdmin && (
            <Link
              href={boardHref(base, 'users')}
              className="rounded-full border border-line px-4 py-1.5 text-sm text-graphite transition-colors hover:border-ink hover:text-ink"
            >
              Utilisateurs
            </Link>
          )}
          <button
            type="button"
            onClick={signOut}
            className="rounded-full border border-line px-4 py-1.5 text-sm text-graphite transition-colors hover:border-ink hover:text-ink"
          >
            Déconnexion
          </button>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="flex shrink-0 items-start justify-between gap-4 border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-800"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="shrink-0 font-medium underline-offset-2 hover:underline"
          >
            Fermer
          </button>
        </div>
      )}

      {/* `min-h-0` : sans lui, une colonne pleine pousserait la hauteur
          au lieu de faire défiler son propre contenu. */}
      <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto p-5">
        {LEAD_STATUSES.map((column) => {
          const columnLeads = leads.filter((lead) => lead.status === column.key)
          if (column.key === 'a_rappeler') columnLeads.sort(byCallback)
          const isOver = overColumn === column.key && dragId !== null

          return (
            <section
              key={column.key}
              className="flex min-h-0 w-80 shrink-0 flex-col"
              onDragOver={(event) => {
                event.preventDefault()
                event.dataTransfer.dropEffect = 'move'
                if (overColumn !== column.key) setOverColumn(column.key)
              }}
              onDrop={(event) => dropOn(column.key, event)}
            >
              <div className="flex shrink-0 items-center justify-between gap-2 px-1 pb-3">
                <h2 className="text-sm font-semibold">{column.label}</h2>
                <span className="rounded-full bg-line px-2 py-0.5 text-xs text-graphite">{columnLeads.length}</span>
              </div>

              {/* Toute la hauteur de la colonne accepte le dépôt, même vide. */}
              <div
                className={`flex min-h-40 flex-1 flex-col gap-2 overflow-y-auto rounded-xl p-1 transition-colors ${
                  isOver ? 'bg-accent-soft/60 ring-2 ring-accent/40' : ''
                }`}
              >
                {columnLeads.map((lead) => {
                  const assignee = members.find((member) => member.id === lead.assigned_to)
                  const leadNotes = notesByLead.get(lead.id) ?? []
                  const lastNote = leadNotes[0]
                  const isDragging = dragId === lead.id

                  return (
                    <article
                      key={lead.id}
                      role="button"
                      tabIndex={0}
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData('text/plain', lead.id)
                        event.dataTransfer.effectAllowed = 'move'
                        setDragId(lead.id)
                      }}
                      onDragEnd={() => {
                        setDragId(null)
                        setOverColumn(null)
                      }}
                      onClick={() => setOpenId(lead.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          setOpenId(lead.id)
                        }
                      }}
                      className={`cursor-grab rounded-xl border border-line bg-card p-3.5 shadow-sm transition-all hover:border-muted active:cursor-grabbing ${
                        isDragging ? 'opacity-40' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-semibold">{vehicleLabel(lead)}</p>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            lead.intent === 'reprise' ? 'bg-ink text-white' : 'bg-accent-soft text-accent-ink'
                          }`}
                        >
                          {lead.intent === 'reprise' ? 'Reprise' : 'Estim.'}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-muted">{summaryLine(lead)}</p>

                      {lead.callback_at && (
                        <p className="mt-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                              CALLBACK_STYLES[callbackTone(lead.callback_at, now)]
                            }`}
                          >
                            Rappel {formatCallback(lead.callback_at)}
                          </span>
                        </p>
                      )}

                      <p className="mt-2 text-sm font-medium">
                        {lead.first_name} {lead.last_name}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                            ORIGIN_STYLES[leadOrigin(lead)]
                          }`}
                        >
                          {ORIGIN_LABELS[leadOrigin(lead)]}
                        </span>
                        <span className="text-xs text-muted">{formatDate(lead.created_at)}</span>
                      </div>

                      {lastNote && (
                        <p className="mt-2 truncate text-xs text-graphite" title={lastNote.body}>
                          <span className="text-muted">
                            Note{leadNotes.length > 1 ? ` (${leadNotes.length})` : ''} ·
                          </span>{' '}
                          {lastNote.body}
                        </p>
                      )}

                      <div className="mt-3 flex items-center gap-2">
                        {lead.phone && (
                          <a
                            href={`tel:${lead.phone.replace(/\s/g, '')}`}
                            onClick={(event) => event.stopPropagation()}
                            className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white"
                          >
                            Appeler
                          </a>
                        )}
                        <a
                          href={`mailto:${lead.email}`}
                          onClick={(event) => event.stopPropagation()}
                          className="rounded-full border border-line px-3 py-1 text-xs text-graphite hover:border-ink hover:text-ink"
                        >
                          Email
                        </a>
                        {assignee && (
                          <span
                            title={memberName(assignee)}
                            className="ml-auto flex size-6 items-center justify-center rounded-full bg-ink text-[10px] font-semibold text-white"
                          >
                            {initials(assignee)}
                          </span>
                        )}
                      </div>
                    </article>
                  )
                })}

                {columnLeads.length === 0 && !isOver && (
                  <p className="px-1 py-6 text-center text-xs text-muted">Aucun lead</p>
                )}
              </div>
            </section>
          )
        })}
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 sm:p-8"
          onClick={() => setOpenId(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-line bg-card p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">
                  {[open.make, open.model, open.version].filter(Boolean).join(' ') || 'Véhicule non précisé'}
                </h2>
                <p className="text-sm text-muted">
                  {INTENT_LABELS[open.intent]} · {formatDate(open.created_at)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpenId(null)}
                className="rounded-full border border-line px-3 py-1 text-sm text-muted hover:text-ink"
              >
                Fermer
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                Commercial en charge
                <select
                  value={open.assigned_to ?? ''}
                  onChange={(event) => setAssignee(open.id, event.target.value || null)}
                  className={`${fieldCls} mt-1`}
                >
                  <option value="">Non attribué</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {memberName(member)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium">
                Date de rappel
                <span className="mt-1 flex gap-2">
                  <input
                    type="datetime-local"
                    value={toLocalInput(open.callback_at)}
                    onChange={(event) => {
                      const value = event.target.value
                      if (!value) return void setCallback(open.id, null)
                      const date = new Date(value)
                      if (!Number.isNaN(date.getTime())) void setCallback(open.id, date.toISOString())
                    }}
                    className={fieldCls}
                  />
                  {open.callback_at && (
                    <button
                      type="button"
                      onClick={() => setCallback(open.id, null)}
                      className="shrink-0 rounded-lg border border-line px-3 text-sm text-graphite hover:border-ink hover:text-ink"
                    >
                      Effacer
                    </button>
                  )}
                </span>
                <span className="mt-1 block text-xs font-normal text-muted">
                  Affichée sur la fiche ; la colonne « À rappeler » est triée par cette date.
                </span>
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {LEAD_STATUSES.map((status) => (
                <button
                  key={status.key}
                  type="button"
                  onClick={() => setStatus(open.id, status.key)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    open.status === status.key
                      ? 'border-accent bg-accent-soft/40 font-medium'
                      : 'border-line bg-card/40 text-graphite hover:border-ink'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>

            {/* `key` : le brouillon de note repart à vide quand on change de fiche. */}
            <NotesPanel key={open.id} notes={openNotes} members={members} onAdd={(body) => addNote(open.id, body)} />

            <dl className="mt-5 divide-y divide-line text-sm">
              {leadRows(rowToLead(open)).map(([label, value]) => (
                <div key={label} className="flex gap-4 py-2">
                  <dt className="w-40 shrink-0 text-muted">{label}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-5 flex gap-2">
              {open.phone && (
                <a
                  href={`tel:${open.phone.replace(/\s/g, '')}`}
                  className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white"
                >
                  Appeler
                </a>
              )}
              <a
                href={`mailto:${open.email}`}
                className="rounded-full border border-line px-5 py-2 text-sm text-graphite hover:border-ink hover:text-ink"
              >
                Répondre par email
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
