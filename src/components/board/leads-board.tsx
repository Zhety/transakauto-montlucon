'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { boardHref } from '@/lib/board-path'
import { INTENT_LABELS, leadRows } from '@/lib/lead'
import {
  LEAD_STATUSES,
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function initials(member: Member): string {
  return `${member.first_name.charAt(0)}${member.last_name?.charAt(0) ?? ''}`.toUpperCase()
}

export function LeadsBoard({
  initialLeads,
  members,
  current,
  base,
}: {
  initialLeads: LeadRow[]
  members: Member[]
  current: { email: string; member: Member }
  /** '' sur leads.transakautomontlucon.com, '/board' sur le domaine principal. */
  base: string
}) {
  const router = useRouter()
  const [leads, setLeads] = useState(initialLeads)
  const [openId, setOpenId] = useState<string | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [overColumn, setOverColumn] = useState<LeadStatus | null>(null)

  const supabase = useMemo(() => createBrowserSupabase(), [])

  // Temps réel : une demande envoyée depuis le site apparaît sans rafraîchir.
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
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [supabase])

  /** Mise à jour optimiste : la colonne bouge tout de suite, la base suit. */
  async function setStatus(id: string, status: LeadStatus) {
    setLeads((list) => list.map((lead) => (lead.id === id ? { ...lead, status } : lead)))
    await supabase.from('leads').update({ status }).eq('id', id)
  }

  async function setAssignee(id: string, assigned_to: string | null) {
    setLeads((list) => list.map((lead) => (lead.id === id ? { ...lead, assigned_to } : lead)))
    await supabase.from('leads').update({ assigned_to }).eq('id', id)
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

      {/* `min-h-0` : sans lui, une colonne pleine pousserait la hauteur
          au lieu de faire défiler son propre contenu. */}
      <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto p-5">
        {LEAD_STATUSES.map((column) => {
          const columnLeads = leads.filter((lead) => lead.status === column.key)
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

            <label className="mt-5 block text-sm font-medium">
              Commercial en charge
              <select
                value={open.assigned_to ?? ''}
                onChange={(event) => setAssignee(open.id, event.target.value || null)}
                className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-ink"
              >
                <option value="">Non attribué</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {memberName(member)}
                  </option>
                ))}
              </select>
            </label>

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
