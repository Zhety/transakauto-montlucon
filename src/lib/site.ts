/**
 * Coordonnées et informations légales de l'agence.
 * Données société vérifiées au registre national des entreprises (SIRET
 * 939 743 308 00016). L'adresse est celle du siège social, qui est aussi
 * celle de l'agence.
 */
export const SITE = {
  name: 'Transakauto Montluçon',
  legalName: 'TFM AUTO (SAS)',
  tagline: "Agence d'intermédiation automobile à Montluçon",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://transakautomontlucon.com',

  phone: '+33 6 14 90 25 48',
  phoneDisplay: '06 14 90 25 48',
  email: 'contact@transakautomontlucon.com',

  address: {
    street: '56 rue Eugène Sue',
    postalCode: '03100',
    city: 'Montluçon',
    country: 'France',
  },

  /** Coordonnées GPS de l'adresse (Base Adresse Nationale). */
  geo: { latitude: 46.36267, longitude: 2.599386 },

  hours: 'Du mardi au vendredi, 10h - 18h30 · Samedi, 10h - 17h',

  /**
   * Pages qui présentent l'agence ailleurs sur le web (données structurées
   * `sameAs`). Y ajouter l'URL de la fiche Google Business Profile et de la
   * page Facebook dès qu'elles existent.
   */
  profiles: ['https://annonces.transakauto.com/concessionnaire-voiture-occasion/agence-montlucon'],

  /** Voitures en vente à l'agence : page agence du site du réseau. */
  stockUrl: 'https://annonces.transakauto.com/concessionnaire-voiture-occasion/agence-montlucon',

  // Mentions légales
  siret: 'SIRET 939 743 308 00016',
  rcs: 'RCS Montluçon 939 743 308',
  vat: 'TVA intracommunautaire FR14 939 743 308',
  director: 'François Gayon',
  hosting: 'Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA',

  areas: [
    'Montluçon',
    'Domérat',
    'Désertines',
    'Commentry',
    'Néris-les-Bains',
    'Vallon-en-Sully',
    'Saint-Éloy-les-Mines',
    'Saint-Amand-Montrond',
    'Guéret',
    "tout l'Allier (03)",
    'le Cher (18)',
    'la Creuse (23)',
  ],
} as const

export const NAV = [
  { href: '/#services', label: 'Nos services' },
  { href: '/#process', label: 'Comment ça marche' },
  { href: '/#faq', label: 'Questions fréquentes' },
] as const
