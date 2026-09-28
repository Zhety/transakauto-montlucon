import { cookies } from 'next/headers'
import type { Member } from './leads-board'
import { createAdminSupabase, createServerSupabase, isSupabaseConfigured } from './supabase'

/**
 * Identifie l'utilisateur connecté au tableau et sa fiche `members`. Le rôle est
 * lu avec la clé de service, pour ne pas dépendre des règles RLS : c'est lui qui
 * décide de l'accès à la gestion des utilisateurs, il doit être fiable.
 */
export async function getCurrentMember(): Promise<{ email: string; member: Member } | null> {
  if (!isSupabaseConfigured) return null

  const supabase = createServerSupabase(await cookies())
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: member } = await createAdminSupabase()
    .from('members')
    .select('id, first_name, last_name, role')
    .eq('id', user.id)
    .maybeSingle()
  if (!member) return null

  return { email: user.email ?? '', member: member as Member }
}
