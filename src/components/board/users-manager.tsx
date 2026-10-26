'use client'

import Link from 'next/link'
import { useState } from 'react'
import { boardHref } from '@/lib/board-path'
import { MEMBER_ROLES, type Member, type MemberRole, memberName } from '@/lib/leads-board'

const field =
  'w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[15px] text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-ink'
const labelCls = 'mb-1.5 block text-sm font-medium text-graphite'

type Draft = { firstName: string; lastName: string; email: string; password: string; role: MemberRole }

const EMPTY: Draft = { firstName: '', lastName: '', email: '', password: '', role: 'commercial' }

export function UsersManager({
  initialMembers,
  currentId,
  base,
}: {
  initialMembers: Member[]
  currentId: string
  /** '' sur leads.transakautomontlucon.com, '/board' sur le domaine principal. */
  base: string
}) {
  const [members, setMembers] = useState(initialMembers)
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [errors, setErrors] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  /** Mot de passe du dernier compte créé, affiché une seule fois. */
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  async function call(method: 'POST' | 'PATCH' | 'DELETE', body: unknown) {
    const response = await fetch('/api/board/users', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = (await response.json().catch(() => ({}))) as {
      ok?: boolean
      errors?: string[]
      member?: Member
      password?: string
    }
    if (!response.ok || !data.ok) throw new Error(data.errors?.join(' · ') ?? 'Une erreur est survenue')
    return data
  }

  async function create(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setErrors([])
    setCreated(null)

    try {
      const data = await call('POST', {
        email: draft.email || undefined,
        password: draft.email ? draft.password || undefined : undefined,
        firstName: draft.firstName,
        lastName: draft.lastName || undefined,
        role: draft.role,
      })
      if (data.member) setMembers((current) => [...current, data.member!].sort((a, b) => a.first_name.localeCompare(b.first_name)))
      if (data.password) setCreated({ email: draft.email, password: data.password })
      setDraft(EMPTY)
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Une erreur est survenue'])
    } finally {
      setSubmitting(false)
    }
  }

  async function changeRole(id: string, role: MemberRole) {
    const previous = members
    setMembers((current) => current.map((member) => (member.id === id ? { ...member, role } : member)))
    try {
      await call('PATCH', { id, role })
    } catch (error) {
      setMembers(previous)
      setErrors([error instanceof Error ? error.message : 'Une erreur est survenue'])
    }
  }

  async function remove(id: string) {
    setConfirmDelete(null)
    const previous = members
    setMembers((current) => current.filter((member) => member.id !== id))
    try {
      await call('DELETE', { id })
    } catch (error) {
      setMembers(previous)
      setErrors([error instanceof Error ? error.message : 'Une erreur est survenue'])
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Utilisateurs</h1>
          <p className="mt-1 text-sm text-muted">Comptes autorisés à ouvrir le tableau, et commerciaux à qui attribuer les leads.</p>
        </div>
        <Link
          href={boardHref(base, '')}
          className="rounded-full border border-line px-4 py-1.5 text-sm text-graphite transition-colors hover:border-ink hover:text-ink"
        >
          ← Retour au tableau
        </Link>
      </div>

      {errors.length > 0 && (
        <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      )}

      {created && (
        <div className="mt-5 rounded-xl border border-accent bg-accent-soft/40 px-4 py-3 text-sm">
          <p className="font-medium">Compte créé pour {created.email}</p>
          <p className="mt-1 text-graphite">
            Mot de passe : <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[13px]">{created.password}</code>
          </p>
          <p className="mt-1 text-xs text-muted">
            Il ne sera plus affiché — transmettez-le maintenant. L&apos;utilisateur pourra le changer ensuite.
          </p>
        </div>
      )}

      <div className="mt-6 divide-y divide-line rounded-2xl border border-line bg-card">
        {members.map((member) => {
          const isSelf = member.id === currentId
          return (
            <div key={member.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {memberName(member)}
                  {isSelf && <span className="ml-2 text-xs text-muted">(vous)</span>}
                </p>
                <p className="truncate text-sm text-muted">
                  {member.email || 'Attribution des leads seulement — pas d’accès au tableau'}
                </p>
              </div>

              {member.email ? (
                <select
                  value={member.role}
                  disabled={isSelf}
                  onChange={(event) => changeRole(member.id, event.target.value as MemberRole)}
                  className="rounded-lg border border-line bg-paper px-3 py-1.5 text-sm outline-none focus:border-ink disabled:opacity-60"
                >
                  {MEMBER_ROLES.map((role) => (
                    <option key={role.key} value={role.key}>
                      {role.label}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="rounded-full bg-line px-3 py-1 text-xs text-graphite">Sans compte</span>
              )}

              {confirmDelete === member.id ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => remove(member.id)}
                    className="rounded-full bg-red-600 px-3 py-1.5 text-sm font-medium text-white"
                  >
                    Confirmer
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(null)}
                    className="rounded-full border border-line px-3 py-1.5 text-sm text-graphite"
                  >
                    Annuler
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isSelf}
                  onClick={() => setConfirmDelete(member.id)}
                  className="rounded-full border border-line px-3 py-1.5 text-sm text-graphite transition-colors hover:border-red-500 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Supprimer
                </button>
              )}
            </div>
          )
        })}
      </div>

      <form onSubmit={create} className="mt-8 rounded-2xl border border-line bg-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight">Ajouter une personne</h2>
        <p className="mt-1 text-sm text-muted">
          Avec un email, la personne reçoit un compte pour ouvrir le tableau. Sans email, c’est un
          commercial à qui attribuer des leads, sans accès.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="firstName">Prénom *</label>
            <input
              id="firstName"
              required
              className={field}
              value={draft.firstName}
              onChange={(event) => setDraft({ ...draft, firstName: event.target.value })}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="lastName">Nom</label>
            <input
              id="lastName"
              className={field}
              value={draft.lastName}
              onChange={(event) => setDraft({ ...draft, lastName: event.target.value })}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="email">
              Email <span className="font-normal text-muted">(vide = sans accès au tableau)</span>
            </label>
            <input
              id="email"
              type="email"
              autoComplete="off"
              className={field}
              value={draft.email}
              onChange={(event) => setDraft({ ...draft, email: event.target.value })}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="role">Rôle *</label>
            <select
              id="role"
              className={field}
              value={draft.role}
              onChange={(event) => setDraft({ ...draft, role: event.target.value as MemberRole })}
            >
              {MEMBER_ROLES.map((role) => (
                <option key={role.key} value={role.key}>
                  {role.label} — {role.help}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="password">
              Mot de passe <span className="font-normal text-muted">(vide = généré automatiquement)</span>
            </label>
            <input
              id="password"
              type="text"
              disabled={!draft.email}
              autoComplete="new-password"
              minLength={10}
              className={field}
              placeholder="10 caractères minimum"
              value={draft.password}
              onChange={(event) => setDraft({ ...draft, password: event.target.value })}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-5 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Création…' : draft.email ? 'Créer le compte' : 'Ajouter'}
        </button>
      </form>
    </div>
  )
}
