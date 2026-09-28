'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { INTENT_LABELS, leadRows } from '@/lib/lead'
import {
  LEAD_STATUSES,
  type LeadRow,
  type LeadStatus,
  type Member,
  memberName,
  rowToLead,
} from '@/lib/leads-board'
import { createBrowserSupabase } from '@/lib/supabase'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function initials(member: Member): string {
  return `${member.first_name.charAt(0)}${member.last_name?.charAt(0) ?? ''}`.toUpperCase()
}

export function LeadsBoard({
  initialLeads,
  members,
  currentEmail,
}: {
  initialLeads: LeadRow[]
  members: Member[]
  currentEmail: string
}) {
  const router = useRouter()
  const [leads, setLeads] = useState(initialLeads)
  const [openId, setOpenId] = useState<string | null>(null)

  const supabase = useMemo(() => createBrowserSupabase(), [])

  // Temps réel : une demande envoyée depuis le site apparaît sans rafraîchir.
  useEffect(() => {
    const channel = supabase
      .channel('leads-board')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, (payload) => {
        setLeads((current) => [payload.new as LeadRow, ...current])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'leads' }, (payload) => {
        const updated = payload.new as LeadRow
        setLeads((current) => current.map((lead) => (lead.id === updated.id ? updated : lead)))
      })
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [supabase])

  /** Mise à jour optimiste : la colonne bouge tout de suite, la base suit. */
  async function setStatus(id: string, status: LeadStatus) {
    setLeads((current) => current.map((lead) => (lead.id === id ? { ...lead, status } : lead)))
    await supabase.from('leads').update({ status }).eq('id', id)
  }

  async function setAssignee(id: string, assigned_to: string | null) {
    setLeads((current) => current.map((lead) => (lead.id === id ? { ...lead, assigned_to } : lead)))
    await supabase.from('leads').update({ assigned_to }).eq('id', id)
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.replace('/board/login')
    router.refresh()
  }

  const open = leads.find((lead) => lead.id === openId) ?? null

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between gap-4 border-b border-line bg-card px-5 py-4">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Transakauto — Leads</h1>
          <span className="text-sm text-muted">{leads.length} demandes</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted sm:block">{currentEmail}</span>
          <button
            type="button"
            onClick={signOut}
            className="rounded-full border border-line px-4 py-1.5 text-sm text-graphite transition-colors hover:border-ink hover:text-ink"
          >
            Déconnexion
          </button>
        </div>
      </header>

      <div className="flex flex-1 gap-4 overflow-x-auto p-5">
        {LEAD_STATUSES.map((column) => {
          const columnLeads = leads.filter((lead) => lead.status === column.key)

          return (
            <section key={column.key} className="flex w-80 shrink-0 flex-col">
              <div className="flex items-center justify-between gap-2 px-1 pb-3">
                <h2 className="text-sm font-semibold">{column.label}</h2>
                <span className="rounded-full bg-line px-2 py-0.5 text-xs text-graphite">{columnLeads.length}</span>
              </div>

              <div className="flex flex-col gap-2">
                {columnLeads.map((lead) => {
                  const assignee = members.find((member) => member.id === lead.assigned_to)

                  return (
                    <article
                      key={lead.id}
                      className="rounded-xl border border-line bg-card p-3.5 shadow-sm transition-colors hover:border-muted"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setOpenId(lead.id)}
                          className="truncate text-left text-sm font-semibold hover:underline"
                        >
                          {lead.make} {lead.model}
                        </button>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            lead.intent === 'reprise' ? 'bg-ink text-white' : 'bg-accent-soft text-accent-ink'
                          }`}
                        >
                          {lead.intent === 'reprise' ? 'Reprise' : 'Estim.'}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-muted">
                        {lead.year} · {lead.mileage_km.toLocaleString('fr-FR')} km · {lead.postal_code}
                      </p>
                      <p className="mt-2 text-sm font-medium">
                        {lead.first_name} {lead.last_name}
                      </p>
                      <p className="text-xs text-muted">{formatDate(lead.created_at)}</p>

                      <div className="mt-3 flex items-center gap-2">
                        <a
                          href={`tel:${lead.phone.replace(/\s/g, '')}`}
                          className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white"
                        >
                          Appeler
                        </a>
                        <a
                          href={`mailto:${lead.email}`}
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

                {columnLeads.length === 0 && (
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
                  {open.make} {open.model} {open.version ?? ''}
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
              <a
                href={`tel:${open.phone.replace(/\s/g, '')}`}
                className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white"
              >
                Appeler
              </a>
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
