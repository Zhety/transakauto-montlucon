import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import type { CookieOptions } from '@supabase/ssr'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

/**
 * Le tableau des leads est facultatif : sans Supabase configuré, le site
 * continue de fonctionner et les demandes partent par email comme avant.
 */
export const isSupabaseConfigured = Boolean(url && anonKey)
export const canWriteLeads = Boolean(url && serviceKey)

/** Client navigateur, soumis aux règles RLS de l'utilisateur connecté. */
export function createBrowserSupabase() {
  return createBrowserClient(url!, anonKey!)
}

type CookieStore = {
  getAll: () => { name: string; value: string }[]
  set: (name: string, value: string, options: CookieOptions) => void
}

/** Client serveur, qui lit et rafraîchit la session dans les cookies. */
export function createServerSupabase(cookies: CookieStore) {
  return createServerClient(url!, anonKey!, {
    cookies: {
      getAll: () => cookies.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) cookies.set(name, value, options)
        } catch {
          // Appelé depuis un composant serveur : le middleware a déjà rafraîchi
          // la session, on peut ignorer.
        }
      },
    },
  })
}

/**
 * Client d'administration, réservé au serveur : il contourne RLS pour insérer
 * les demandes reçues. Ne jamais l'exposer au navigateur.
 */
export function createAdminSupabase() {
  return createClient(url!, serviceKey!, { auth: { persistSession: false } })
}
