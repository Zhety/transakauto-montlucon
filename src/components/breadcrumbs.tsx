import Link from 'next/link'
import type { Crumb } from '@/lib/seo'

/** Fil d'Ariane visible, posé sur le bandeau noir des pages intérieures. */
export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Fil d'Ariane" className="text-xs text-white/60">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1
          return (
            <li key={crumb.path} className="flex items-center gap-2">
              {last ? (
                <span aria-current="page" className="text-white/80">
                  {crumb.name}
                </span>
              ) : (
                <>
                  <Link href={crumb.path} className="transition-colors hover:text-white">
                    {crumb.name}
                  </Link>
                  <span aria-hidden>/</span>
                </>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
