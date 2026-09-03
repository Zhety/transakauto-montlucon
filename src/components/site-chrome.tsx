import Image from 'next/image'
import Link from 'next/link'
import { NAV, SITE } from '@/lib/site'
import logo from '../../public/transakauto-logo.png'

/**
 * Logo officiel du réseau : lettrage blanc sur fond transparent, il suppose
 * donc un fond sombre — d'où le header noir.
 */
export function Logo({ className = '', priority = false }: { className?: string; priority?: boolean }) {
  return (
    <Link href="/" className={`group inline-flex items-center gap-3 ${className}`} aria-label={`${SITE.name} — accueil`}>
      <Image src={logo} alt="Transakauto" height={38} priority={priority} className="h-9 w-auto sm:h-10" />
      <span className="hidden border-l border-white/25 pl-3 text-[11px] font-medium uppercase tracking-[0.28em] text-white/70 sm:block">
        Montluçon
      </span>
    </Link>
  )
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-ink/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-4 px-5">
        <Logo priority />

        <nav className="hidden items-center gap-7 text-sm text-white/70 md:flex">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="transition-colors hover:text-white">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={`tel:${SITE.phone.replace(/\s/g, '')}`}
            className="hidden rounded-full border border-white/25 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-white sm:inline-flex"
          >
            {SITE.phoneDisplay}
          </a>
          <Link
            href="/estimation"
            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-px"
          >
            Estimer ma voiture
          </Link>
        </div>
      </div>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-ink text-white/70">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed">
            Agence d&apos;intermédiation automobile. Nous vendons votre véhicule à votre place, au meilleur prix du
            marché, sans risque et sans perte de temps.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Nos services</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link href="/estimation" className="transition-colors hover:text-accent">
                Estimation gratuite
              </Link>
            </li>
            <li>
              <Link href="/reprise" className="transition-colors hover:text-accent">
                Demande de reprise
              </Link>
            </li>
            <li>
              <a href="/#process" className="transition-colors hover:text-accent">
                Comment ça marche
              </a>
            </li>
            <li>
              <a href="/#faq" className="transition-colors hover:text-accent">
                Questions fréquentes
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Contact</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <a href={`tel:${SITE.phone.replace(/\s/g, '')}`} className="transition-colors hover:text-accent">
                {SITE.phoneDisplay}
              </a>
            </li>
            <li>
              <a href={`mailto:${SITE.email}`} className="transition-colors hover:text-accent">
                {SITE.email}
              </a>
            </li>
            <li>
              {SITE.address.street}
              <br />
              {SITE.address.postalCode} {SITE.address.city}
            </li>
            <li className="text-white/50">{SITE.hours}</li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Zone d&apos;intervention</h3>
          <p className="mt-4 text-sm leading-relaxed">{SITE.areas.join(', ')}.</p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {SITE.legalName}. Tous droits réservés.
          </p>
          <div className="flex gap-5">
            <Link href="/mentions-legales" className="transition-colors hover:text-white">
              Mentions légales
            </Link>
            <Link href="/confidentialite" className="transition-colors hover:text-white">
              Confidentialité
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
