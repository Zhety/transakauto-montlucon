/**
 * Le tableau vit sous /board dans l'application, mais sur le sous-domaine
 * `leads.` le middleware masque ce préfixe : les liens y sont /, /login, /users.
 * Les pages calculent la base une fois, côté serveur (voir board-path-server),
 * et la passent aux composants client — ainsi le HTML rendu et le navigateur
 * sont d'accord. Ce module n'importe rien de serveur : les composants client
 * l'utilisent aussi.
 */
export function boardBase(host: string | null): string {
  return host?.startsWith('leads.') ? '' : '/board'
}

/** Chemin d'une page du tableau depuis sa base : ('', 'users') → '/users'. */
export function boardHref(base: string, page: '' | 'login' | 'users'): string {
  const path = `${base}/${page}`.replace(/\/+$/, '')
  return path === '' ? '/' : path
}
