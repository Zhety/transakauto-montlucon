import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentMember } from '@/lib/board-auth'
import { MEMBER_ROLES } from '@/lib/leads-board'
import { canWriteLeads, createAdminSupabase } from '@/lib/supabase'

export const runtime = 'nodejs'

const roleSchema = z.enum(MEMBER_ROLES.map((role) => role.key) as ['admin', 'commercial'])

const createSchema = z.object({
  email: z.string().trim().email('Email invalide').max(160),
  password: z.string().min(10, 'Mot de passe : 10 caractères minimum').max(128).optional(),
  firstName: z.string().trim().min(1, 'Prénom requis').max(60),
  lastName: z.string().trim().max(60).optional(),
  role: roleSchema,
})

const updateSchema = z.object({ id: z.string().uuid(), role: roleSchema })
const deleteSchema = z.object({ id: z.string().uuid() })

/** Mot de passe lisible, communiqué une seule fois à l'admin qui crée le compte. */
function generatePassword(): string {
  const lower = 'abcdefghijkmnpqrstuvwxyz'
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const digits = '23456789'
  const symbols = '!@#%&'
  const all = lower + upper + digits + symbols
  const pick = (set: string) => set[Math.floor(Math.random() * set.length)]
  const chars = [pick(lower), pick(upper), pick(digits), pick(symbols)]
  while (chars.length < 14) chars.push(pick(all))
  return chars.sort(() => Math.random() - 0.5).join('')
}

/**
 * Seul un administrateur connecté peut gérer les comptes. La vérification passe
 * par la clé de service : elle ne dépend pas de ce que le navigateur prétend.
 */
async function requireAdmin() {
  const current = await getCurrentMember()
  if (!current || current.member.role !== 'admin') return null
  return current
}

function forbidden() {
  return NextResponse.json({ ok: false, errors: ['Accès réservé aux administrateurs'] }, { status: 403 })
}

function invalid(issues: z.ZodIssue[]) {
  return NextResponse.json({ ok: false, errors: issues.map((issue) => issue.message) }, { status: 422 })
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) return forbidden()
  if (!canWriteLeads) return NextResponse.json({ ok: false, errors: ['Clé de service manquante'] }, { status: 500 })

  const parsed = createSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return invalid(parsed.error.issues)

  const { email, firstName, lastName, role } = parsed.data
  const password = parsed.data.password ?? generatePassword()
  const admin = createAdminSupabase()

  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
  if (error || !data.user) {
    const message = /already|exists|registered/i.test(error?.message ?? '')
      ? 'Un compte existe déjà avec cet email'
      : (error?.message ?? 'Création du compte impossible')
    return NextResponse.json({ ok: false, errors: [message] }, { status: 400 })
  }

  const { error: memberError } = await admin
    .from('members')
    .insert({ id: data.user.id, first_name: firstName, last_name: lastName || null, role })

  if (memberError) {
    // Pas de compte orphelin : on annule la création côté auth.
    await admin.auth.admin.deleteUser(data.user.id)
    return NextResponse.json({ ok: false, errors: [memberError.message] }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    member: { id: data.user.id, first_name: firstName, last_name: lastName || null, role, email },
    // Renvoyé une seule fois : l'admin le transmet au nouvel utilisateur.
    password,
  })
}

export async function PATCH(request: Request) {
  const current = await requireAdmin()
  if (!current) return forbidden()

  const parsed = updateSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return invalid(parsed.error.issues)

  const { id, role } = parsed.data

  // Un admin ne peut pas se rétrograder lui-même : il n'y aurait plus personne
  // pour gérer les comptes.
  if (id === current.member.id && role !== 'admin') {
    return NextResponse.json({ ok: false, errors: ['Vous ne pouvez pas retirer votre propre rôle admin'] }, { status: 400 })
  }

  const { error } = await createAdminSupabase().from('members').update({ role }).eq('id', id)
  if (error) return NextResponse.json({ ok: false, errors: [error.message] }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const current = await requireAdmin()
  if (!current) return forbidden()

  const parsed = deleteSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return invalid(parsed.error.issues)

  const { id } = parsed.data
  if (id === current.member.id) {
    return NextResponse.json({ ok: false, errors: ['Vous ne pouvez pas supprimer votre propre compte'] }, { status: 400 })
  }

  // La suppression du compte auth entraîne celle de la ligne `members`
  // (clé étrangère en cascade) ; les leads qui lui étaient attribués repassent
  // en « non attribué ».
  const { error } = await createAdminSupabase().auth.admin.deleteUser(id)
  if (error) return NextResponse.json({ ok: false, errors: [error.message] }, { status: 500 })

  return NextResponse.json({ ok: true })
}
