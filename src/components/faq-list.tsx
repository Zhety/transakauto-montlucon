import type { FaqItem } from '@/lib/seo'

/** Questions dépliables. Les données structurées sont émises par la page. */
export function FaqList({ items }: { items: readonly FaqItem[] }) {
  return (
    <div className="mt-10 divide-y divide-line border-y border-line">
      {items.map((item) => (
        <details key={item.q} className="group py-5">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-[17px] font-medium">
            {item.q}
            <span aria-hidden className="mt-1 shrink-0 text-muted transition-transform group-open:rotate-45">
              +
            </span>
          </summary>
          <p className="mt-3 text-[15px] leading-relaxed text-graphite">{item.a}</p>
        </details>
      ))}
    </div>
  )
}
