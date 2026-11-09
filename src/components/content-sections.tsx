import Link from 'next/link'
import type { ContentSection } from '@/lib/landing-pages'

function SectionLink({ href, label }: { href: string; label: string }) {
  const className =
    'mt-5 inline-flex items-center gap-1.5 text-[15px] font-semibold text-accent-ink underline underline-offset-4'
  return href.startsWith('http') ? (
    <a href={href} target="_blank" rel="noopener" className={className}>
      {label} →
    </a>
  ) : (
    <Link href={href} className={className}>
      {label} →
    </Link>
  )
}

/** Sections de texte des pages de référencement : titre, paragraphes, liste, tableau. */
export function ContentSections({ sections }: { sections: ContentSection[] }) {
  return (
    <div className="space-y-14">
      {sections.map((section) => (
        <section key={section.title}>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{section.title}</h2>

          {section.paragraphs?.map((paragraph) => (
            <p key={paragraph} className="mt-4 text-[15px] leading-relaxed text-graphite">
              {paragraph}
            </p>
          ))}

          {section.bullets && (
            <ul className="mt-5 space-y-2.5 text-[15px] leading-relaxed text-graphite">
              {section.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-3">
                  <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                  {bullet}
                </li>
              ))}
            </ul>
          )}

          {section.table && (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-line text-sm uppercase tracking-[0.12em] text-graphite">
                    {section.table.head.map((cell, index) => (
                      <th key={index} scope="col" className={`py-3 pr-5 font-medium ${index === 2 ? 'text-ink' : ''}`}>
                        {cell}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {section.table.rows.map(([label, them, us]) => (
                    <tr key={label} className="border-b border-line/70 align-top">
                      <th scope="row" className="py-3.5 pr-5 text-[15px] font-medium">
                        {label}
                      </th>
                      <td className="py-3.5 pr-5 text-[15px] text-graphite">{them}</td>
                      <td className="py-3.5 text-[15px] font-medium text-ink">{us}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {section.link && <SectionLink {...section.link} />}
        </section>
      ))}
    </div>
  )
}
