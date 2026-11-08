import Link from 'next/link'
import { PAGE_LINKS } from '@/lib/landing-pages'

/** Maillage interne : cartes vers les pages voisines. */
export function RelatedLinks({ paths, title = 'Voir aussi' }: { paths: string[]; title?: string }) {
  const links = paths.filter((path) => PAGE_LINKS[path])
  if (links.length === 0) return null

  return (
    <section>
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {links.map((path) => (
          <Link
            key={path}
            href={path}
            className="group rounded-2xl border border-line bg-card p-5 transition-colors hover:border-ink"
          >
            <span className="text-[15px] font-semibold tracking-tight group-hover:text-accent-ink">
              {PAGE_LINKS[path].label} →
            </span>
            <span className="mt-1.5 block text-sm leading-relaxed text-graphite">{PAGE_LINKS[path].hint}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
