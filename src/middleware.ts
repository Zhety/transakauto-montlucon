import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * Deux rôles :
 *  - servir le tableau des leads sur le sous-domaine `leads.` (le site public
 *    et l'outil interne vivent dans le même déploiement) ;
 *  - rafraîchir la session Supabase, sans quoi elle expirerait au bout d'une
 *    heure et l'agence serait déconnectée en pleine journée.
 */
export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const isLeadsHost = host.startsWith('leads.')

  let response = NextResponse.next({ request })

  if (isLeadsHost && !request.nextUrl.pathname.startsWith('/board')) {
    const rewritten = request.nextUrl.clone()
    rewritten.pathname = `/board${request.nextUrl.pathname === '/' ? '' : request.nextUrl.pathname}`
    response = NextResponse.rewrite(rewritten)
  }

  if (url && anonKey) {
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          for (const { name, value } of list) request.cookies.set(name, value)
          for (const { name, value, options } of list) response.cookies.set(name, value, options)
        },
      },
    })

    // Indispensable : c'est cet appel qui renouvelle le jeton.
    await supabase.auth.getUser()
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.png$).*)'],
}
