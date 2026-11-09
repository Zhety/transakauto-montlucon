import type { FaqItem } from '@/lib/seo'
import { SITE } from '@/lib/site'

/**
 * Pages de référencement : une page par recherche qui compte localement
 * (dépôt-vente, crédit / LOA, villes de la zone). Chaque texte est propre à
 * sa page — des pages « ville » identiques au nom près seraient traitées par
 * Google comme des pages satellites et pénaliseraient tout le site.
 *
 * Ajouter une page : un objet ici suffit (route, sitemap et maillage suivent).
 */

export interface ContentSection {
  title: string
  paragraphs?: string[]
  bullets?: string[]
  table?: { head: [string, string, string]; rows: Array<[string, string, string]> }
  /** Lien d'action sous la section (interne, ou externe : nouvel onglet). */
  link?: { href: string; label: string }
}

/** service : une offre de l'agence ; city : une ville de la zone ; guide : un article pratique. */
export type LandingKind = 'service' | 'city' | 'guide'

export interface LandingPageContent {
  slug: string
  kind: LandingKind
  /** Date de dernière mise à jour du contenu (sitemap). */
  updated: string
  metaTitle: string
  metaDescription: string
  /** Libellé court : fil d'Ariane, liens du pied de page. */
  label: string
  eyebrow: string
  title: string
  intro: string
  sections: ContentSection[]
  faq: FaqItem[]
  related: string[]
  serviceType: string
  /** Lieux desservis mis en avant (données structurées). Pour une ville, le premier est son nom. */
  places?: string[]
  /** Bouton principal du bandeau, à la place de « Estimer ma voiture gratuitement ». */
  primaryCta?: { href: string; label: string }
}

/** Libellés des liens internes entre pages (« Voir aussi »). */
export const PAGE_LINKS: Record<string, { label: string; hint: string }> = {
  '/estimation': { label: 'Estimation gratuite', hint: 'La valeur réelle de votre voiture, sous 24h ouvrées.' },
  '/reprise': { label: 'Rachat et reprise', hint: 'Une offre ferme, sans attendre de trouver un acheteur.' },
  '/depot-vente-voiture-montlucon': {
    label: 'Dépôt-vente à Montluçon',
    hint: 'Le service d’un dépôt-vente, sans immobiliser votre voiture.',
  },
  '/vendre-voiture-credit-loa-montlucon': {
    label: 'Voiture en crédit ou en LOA',
    hint: 'Le solde est réglé dans la vente, vous encaissez la différence.',
  },
  '/vendre-sa-voiture-rapidement-montlucon': {
    label: 'Vendre sa voiture rapidement',
    hint: 'Reprise ferme sous 24h ou vente en 22 jours en moyenne.',
  },
  '/voiture-occasion-montlucon': {
    label: "Acheter une voiture d'occasion",
    hint: 'Des voitures de particuliers, avec la sécurité d’une agence.',
  },
  '/documents-pour-vendre-sa-voiture': {
    label: 'Documents pour vendre sa voiture',
    hint: 'La liste complète, et les démarches après la vente.',
  },
  '/vendre-sa-voiture-gueret': { label: 'Vendre sa voiture à Guéret', hint: 'Guéret et toute la Creuse.' },
  '/vendre-sa-voiture-saint-amand-montrond': {
    label: 'Vendre sa voiture à Saint-Amand-Montrond',
    hint: 'Saint-Amand-Montrond et le sud du Cher.',
  },
  '/vendre-sa-voiture-commentry': { label: 'Vendre sa voiture à Commentry', hint: 'Commentry, Néris-les-Bains et alentours.' },
}

const SERVICES = [
  'Estimation gratuite sous 24h ouvrées, fondée sur le marché local',
  'Reportage photo et annonce diffusée sur les grandes plateformes',
  'Appels filtrés : vous ne rencontrez que des acheteurs sérieux',
  'Visites, essais et négociation gérés avec vous',
  'Paiement contrôlé avant la remise des clés',
  'Déclaration de cession et dossier administratif pris en charge',
]

export const LANDING_PAGES: LandingPageContent[] = [
  {
    slug: 'depot-vente-voiture-montlucon',
    kind: 'service',
    updated: '2026-11-09',
    metaTitle: 'Dépôt-vente voiture à Montluçon | Transakauto',
    metaDescription:
      "L'alternative au dépôt-vente à Montluçon : votre voiture reste chez vous, nous gérons annonce, visites et paiement. Commission uniquement si elle est vendue.",
    label: 'Dépôt-vente voiture',
    eyebrow: 'Dépôt-vente automobile · Montluçon',
    title: 'Dépôt-vente de voiture à Montluçon, sans laisser votre voiture sur un parking',
    intro:
      "Le dépôt-vente séduit parce qu'un professionnel vend à votre place. Son défaut : votre voiture reste immobilisée chez lui, parfois pendant des semaines. Avec Transakauto Montluçon, vous profitez du même accompagnement, mais vous gardez votre véhicule jusqu'au jour de la vente.",
    serviceType: 'Vente de véhicule d’occasion en dépôt-vente',
    sections: [
      {
        title: 'Le dépôt-vente classique, comment ça marche ?',
        paragraphs: [
          "Vous confiez votre véhicule à un garage ou à une agence. Il est exposé sur son parc, présenté aux clients de passage, et le professionnel se rémunère par une commission une fois la vente conclue.",
          "Pendant toute cette période, la voiture ne vous sert plus. Vous continuez pourtant à l'assurer, et sa valeur continue de baisser avec le temps. Selon les contrats, des frais de dossier ou de garde peuvent aussi s'appliquer, même si la voiture ne trouve pas preneur.",
        ],
      },
      {
        title: 'Notre formule : le dépôt-vente, sans le dépôt',
        paragraphs: [
          "Nous faisons le travail d'un dépôt-vente, mais votre voiture reste chez vous et vous continuez à vous en servir. Vous ne payez rien tant qu'elle n'est pas vendue.",
        ],
        bullets: SERVICES,
      },
      {
        title: 'Dépôt-vente classique ou Transakauto : la comparaison',
        table: {
          head: ['', 'Dépôt-vente classique', 'Transakauto Montluçon'],
          rows: [
            ['Votre voiture pendant la vente', 'Immobilisée sur le parc', 'Chez vous, vous continuez à rouler'],
            ['Visites et essais', 'Sur place, aux horaires du garage', 'Organisés avec vous, acheteurs filtrés'],
            ['Si la voiture ne se vend pas', 'Frais possibles selon le contrat', '0 €, rien à payer'],
            ['Sécurité du paiement', 'Gérée par le dépositaire', 'Fonds contrôlés avant la remise des clés'],
            ['Démarches administratives', 'Selon le contrat', 'Dossier complet pris en charge'],
          ],
        },
      },
      {
        title: 'Dépôt-vente ou reprise : combien ça rapporte ?',
        paragraphs: [
          "Une reprise par un garage est rapide, mais son prix intègre la marge du professionnel, la remise en état et le risque de revente : il se situe en général nettement sous le prix d'une vente entre particuliers.",
          "La vente accompagnée vise au contraire le prix du marché entre particuliers. Notre commission est fixée avec vous avant la mise en vente : vous connaissez dès le départ le prix visé et ce que coûte le service.",
          "Vous êtes pressé ? Nous pouvons aussi vous faire une proposition de reprise ferme. Vous comparez les deux options, et vous choisissez.",
        ],
      },
      {
        title: 'Quels véhicules prenons-nous en charge ?',
        paragraphs: [
          "De la petite citadine au véhicule haut de gamme, en passant par les familiales et les SUV : toutes les marques et tous les kilométrages, à condition que le véhicule soit en état de rouler. Nous ne prenons pas en charge les véhicules en panne ou immobilisés.",
        ],
      },
    ],
    faq: [
      {
        q: "Dois-je laisser ma voiture à l'agence ?",
        a: "Non. C'est la grande différence avec un dépôt-vente classique : votre voiture reste chez vous et vous continuez à l'utiliser. Les visites et les essais sont organisés avec vous, uniquement avec des acheteurs sérieux.",
      },
      {
        q: 'Combien coûte le service ?',
        a: "L'estimation est gratuite. Notre commission est fixée en accord avec vous avant la mise en vente et prélevée uniquement le jour de la vente. Si la voiture n'est pas vendue, vous ne payez rien.",
      },
      {
        q: 'Combien de temps faut-il pour vendre ?',
        a: "22 jours en moyenne pour un véhicule positionné au bon prix. Si vous devez aller plus vite, une reprise ferme reste possible.",
      },
      {
        q: 'Ma voiture est encore en crédit, est-ce un problème ?',
        a: "Non. Nous intégrons le solde du crédit ou de la LOA à la transaction : l'organisme de financement est remboursé et vous encaissez la différence.",
      },
    ],
    related: ['/estimation', '/reprise', '/vendre-voiture-credit-loa-montlucon'],
  },

  {
    slug: 'vendre-voiture-credit-loa-montlucon',
    kind: 'service',
    updated: '2026-11-09',
    metaTitle: 'Vendre sa voiture en crédit ou LOA à Montluçon | Transakauto',
    metaDescription:
      'Voiture pas encore payée ? Nous intégrons le solde de votre crédit ou de votre LOA à la vente et vous encaissez la différence. Estimation gratuite sous 24h.',
    label: 'Voiture en crédit ou en LOA',
    eyebrow: 'Crédit · LOA · Leasing',
    title: 'Vendre sa voiture en crédit ou en LOA à Montluçon',
    intro:
      "Votre voiture n'est pas encore entièrement payée et vous voulez la vendre ? C'est possible, et c'est même une de nos spécialités. Nous calculons avec votre organisme le montant restant dû, nous l'intégrons à la transaction, et vous encaissez la différence.",
    serviceType: 'Vente de véhicule sous crédit ou en location avec option d’achat',
    sections: [
      {
        title: 'Voiture à crédit : vous êtes déjà propriétaire',
        paragraphs: [
          "Avec un crédit auto classique, la carte grise est à votre nom : vous êtes propriétaire et vous pouvez vendre. Le prêt, lui, reste dû. Dans la plupart des cas, on le rembourse par anticipation avec le prix de vente.",
          "Si l'organisme de crédit a inscrit un gage sur le véhicule, il doit être levé avant la vente. C'est l'organisme qui délivre cette mainlevée, une fois le solde réglé. Le certificat de situation administrative, que nous demandons pour chaque vente, indique si un gage existe.",
          "Bonne nouvelle : pour un crédit à la consommation, les indemnités de remboursement anticipé sont plafonnées par la loi. Elles ne peuvent pas dépasser 1 % du montant remboursé, 0,5 % s'il reste moins d'un an de crédit, et aucune ne peut être réclamée si vous remboursez moins de 10 000 € sur douze mois.",
        ],
      },
      {
        title: "Voiture en LOA : l'option d'achat se lève dans la vente",
        paragraphs: [
          "En location avec option d'achat, la voiture appartient à la société de financement : la carte grise est à son nom. Pour la vendre, il faut d'abord lever l'option d'achat par anticipation.",
          "L'organisme vous indique le montant à régler, qui dépend de votre contrat : loyers restant à courir, valeur de l'option d'achat et éventuels frais. Ce montant est réglé au moment de la vente, puis le véhicule peut être cédé à l'acheteur.",
        ],
      },
      {
        title: 'Et en location longue durée (LLD) ?',
        paragraphs: [
          "En LLD, il n'y a pas d'option d'achat : la voiture ne vous appartient pas et vous ne pouvez pas la vendre vous-même. Une sortie anticipée se négocie avec le loueur et entraîne en général des frais. Appelez-nous avec votre contrat : nous regardons ensemble si une solution est intéressante.",
        ],
      },
      {
        title: 'La vente, étape par étape',
        bullets: [
          'Vous nous décrivez votre véhicule et votre financement : organisme, type de contrat, date de fin.',
          "Vous demandez à votre organisme un décompte de remboursement anticipé : c'est le montant exact à solder.",
          "Nous estimons le véhicule : vous savez tout de suite ce qu'il vous restera une fois le solde réglé.",
          "Nous vendons la voiture. Le jour de la vente, l'organisme est remboursé et vous encaissez la différence.",
        ],
      },
      {
        title: 'Et si le crédit dépasse la valeur de la voiture ?',
        paragraphs: [
          "Cela arrive, surtout dans les premières années d'un crédit ou d'une LOA avec un faible apport. La différence reste alors à votre charge le jour de la vente.",
          "Mieux vaut le savoir avant de vous engager. C'est exactement ce que montre notre estimation, gratuite et sans engagement.",
        ],
      },
    ],
    faq: [
      {
        q: "Peut-on vendre une voiture qui n'est pas encore payée ?",
        a: "Oui. Avec un crédit classique, vous êtes déjà propriétaire. En LOA, il faut lever l'option d'achat par anticipation. Dans les deux cas, le montant restant dû est réglé avec le prix de vente et vous encaissez la différence.",
      },
      {
        q: 'Faut-il rembourser le crédit avant de mettre la voiture en vente ?',
        a: "Non. La voiture peut être mise en vente avant : le solde est réglé au moment de la vente, avec l'argent de l'acheteur.",
      },
      {
        q: 'Y a-t-il des frais de remboursement anticipé ?',
        a: "Pour un crédit à la consommation, ils sont plafonnés par la loi : 1 % du montant remboursé au maximum, 0,5 % s'il reste moins d'un an de crédit, et aucun si vous remboursez moins de 10 000 € sur douze mois. En LOA, les conditions de levée anticipée dépendent de votre contrat.",
      },
      {
        q: 'Quels documents faut-il prévoir ?',
        a: "Votre contrat de financement, le décompte de remboursement anticipé fourni par l'organisme, la carte grise, votre pièce d'identité et le contrôle technique de moins de six mois si la voiture a plus de quatre ans.",
      },
    ],
    related: ['/estimation', '/reprise', '/depot-vente-voiture-montlucon'],
  },

  {
    slug: 'vendre-sa-voiture-gueret',
    kind: 'city',
    updated: '2026-11-09',
    metaTitle: 'Vendre sa voiture à Guéret et en Creuse | Transakauto',
    metaDescription:
      'Vous habitez Guéret ou la Creuse ? Estimation gratuite sous 24h, annonce, visites et paiement sécurisé : nous vendons votre voiture à votre place.',
    label: 'Vendre sa voiture à Guéret',
    eyebrow: 'Guéret · Creuse (23)',
    title: "Vendre sa voiture à Guéret, sans s'en occuper",
    intro:
      "Vous habitez Guéret ou ses environs et vous voulez vendre votre voiture au juste prix, sans passer vos soirées au téléphone ? Notre agence de Montluçon accompagne les vendeurs de toute la Creuse : estimation, annonce, visites et paiement sécurisé.",
    serviceType: 'Vente de véhicule d’occasion pour le compte de particuliers',
    places: ['Guéret', 'Creuse'],
    sections: [
      {
        title: 'Vendre en Creuse : trouver les bons acheteurs',
        paragraphs: [
          "En Creuse, une annonce vue seulement autour de chez soi touche peu d'acheteurs : la population est dispersée, et les bons clients viennent souvent de plus loin. Le risque, faute de candidats, est de baisser son prix ou de céder sa voiture à une reprise peu avantageuse.",
          "Nous diffusons votre annonce sur les grandes plateformes et nous filtrons les contacts. Votre voiture est vue bien au-delà de Guéret, et vous ne rencontrez que des acheteurs sérieux.",
        ],
      },
      {
        title: 'Pas besoin de venir à Montluçon',
        paragraphs: [
          "Notre agence se trouve à Montluçon, à environ une heure de Guéret par la N145. Vous n'avez pas à faire le trajet pour lancer la vente : la demande, l'estimation et le suivi se font par téléphone et en ligne.",
          "Pour le reportage photo, les visites et la remise des clés, votre conseiller convient avec vous de l'organisation la plus pratique. Votre voiture reste chez vous jusqu'à la vente.",
        ],
      },
      {
        title: 'Ce que nous faisons pour vous',
        bullets: SERVICES,
      },
      {
        title: 'Vendre au meilleur prix ou vendre vite ?',
        paragraphs: [
          "La vente accompagnée vise le prix du marché entre particuliers : comptez 22 jours en moyenne pour un véhicule au bon prix. Si vous devez vendre rapidement, nous vous faisons une proposition de reprise ferme, avec un paiement sécurisé. Vous comparez, et vous choisissez.",
        ],
      },
    ],
    faq: [
      {
        q: 'Intervenez-vous vraiment à Guéret ?',
        a: "Oui. Notre agence est à Montluçon, mais nous accompagnons les vendeurs de Guéret et de toute la Creuse. L'estimation se fait à distance, et l'organisation des visites est convenue avec vous.",
      },
      {
        q: "Combien coûte l'estimation ?",
        a: "Rien. Elle est gratuite et sans engagement, avec une réponse sous 24h ouvrées. Vous restez libre de vendre ou non.",
      },
      {
        q: 'Quels véhicules acceptez-vous ?',
        a: "Toutes les marques et tous les kilométrages, à condition que le véhicule soit en état de rouler. Nous ne prenons pas en charge les véhicules en panne ou immobilisés.",
      },
    ],
    related: ['/estimation', '/reprise', '/vendre-sa-voiture-saint-amand-montrond'],
  },

  {
    slug: 'vendre-sa-voiture-saint-amand-montrond',
    kind: 'city',
    updated: '2026-11-09',
    metaTitle: 'Vendre sa voiture à Saint-Amand-Montrond | Transakauto',
    metaDescription:
      "Saint-Amand-Montrond et sud du Cher : estimation gratuite sous 24h, vente accompagnée ou reprise. Votre voiture reste chez vous jusqu'à la vente.",
    label: 'Vendre sa voiture à Saint-Amand-Montrond',
    eyebrow: 'Saint-Amand-Montrond · Cher (18)',
    title: 'Vendre sa voiture à Saint-Amand-Montrond au meilleur prix',
    intro:
      "Vous habitez Saint-Amand-Montrond ou le sud du Cher ? Notre agence de Montluçon, à moins d'une heure de route, vend votre voiture à votre place : estimation gratuite, annonce, acheteurs filtrés et paiement sécurisé.",
    serviceType: 'Vente de véhicule d’occasion pour le compte de particuliers',
    places: ['Saint-Amand-Montrond', 'Cher'],
    sections: [
      {
        title: 'Vendre seul : du temps, et des risques',
        paragraphs: [
          "Publier soi-même une annonce, c'est recevoir des appels à toute heure : curieux, négociateurs agressifs, rendez-vous manqués. C'est aussi s'exposer aux arnaques les plus courantes, comme le faux chèque de banque ou le virement annulé après la remise des clés.",
          "Nous prenons ce rôle à votre place. Nous filtrons les appels, organisons les visites et les essais avec des acheteurs vérifiés, et contrôlons les fonds avant toute remise des clés.",
        ],
      },
      {
        title: 'Ce qui fait le prix de votre voiture',
        paragraphs: [
          "Une cote en ligne donne une moyenne théorique. Nous la croisons avec les annonces comparables et les ventes réellement conclues dans la région, puis nous tenons compte de ce qui fait la différence aux yeux d'un acheteur :",
        ],
        bullets: [
          "L'année et le kilométrage",
          "L'historique d'entretien : carnet à jour et factures",
          'Un contrôle technique récent, sans défaut majeur',
          "L'état de la carrosserie, de l'intérieur et des pneus",
          'Le nombre de propriétaires précédents',
          'La motorisation et la demande actuelle pour ce modèle',
        ],
      },
      {
        title: "Votre voiture reste chez vous jusqu'à la vente",
        paragraphs: [
          "Contrairement à un dépôt-vente, vous n'avez pas à laisser votre voiture sur un parking à Montluçon. Vous continuez à vous en servir, et votre conseiller organise avec vous les visites et la remise des clés. Vous ne payez rien tant qu'elle n'est pas vendue.",
        ],
      },
    ],
    faq: [
      {
        q: 'Faut-il se déplacer à Montluçon ?',
        a: "Non. La demande et l'estimation se font en ligne ou par téléphone, et votre conseiller organise la suite avec vous.",
      },
      {
        q: 'Combien de temps pour vendre ?',
        a: '22 jours en moyenne pour un véhicule au bon prix. Une reprise ferme peut être bouclée en quelques jours.',
      },
      {
        q: 'Et si je veux seulement connaître la valeur de ma voiture ?',
        a: "Demandez une estimation : elle est gratuite et sans engagement, et vous restez libre de vendre ou non.",
      },
    ],
    related: ['/estimation', '/reprise', '/depot-vente-voiture-montlucon'],
  },

  {
    slug: 'vendre-sa-voiture-commentry',
    kind: 'city',
    updated: '2026-11-09',
    metaTitle: 'Vendre sa voiture à Commentry | Transakauto Montluçon',
    metaDescription:
      'À une vingtaine de minutes de notre agence de Montluçon : estimation gratuite sous 24h, vente accompagnée ou reprise de votre voiture à Commentry.',
    label: 'Vendre sa voiture à Commentry',
    eyebrow: 'Commentry · Allier (03)',
    title: 'Vendre sa voiture à Commentry, avec une agence à côté de chez vous',
    intro:
      "Commentry est à une vingtaine de minutes de notre agence de Montluçon. Nous y accompagnons les vendeurs de A à Z : estimation gratuite, annonce, visites, négociation et paiement sécurisé.",
    serviceType: 'Vente de véhicule d’occasion pour le compte de particuliers',
    places: ['Commentry', 'Néris-les-Bains'],
    sections: [
      {
        title: 'Une agence de proximité',
        paragraphs: [
          "Pas de plateforme anonyme : vous avez un conseiller à Montluçon, joignable par téléphone, qui connaît le marché de l'Allier. Il vous suit de l'estimation jusqu'à la remise des clés.",
          `Vous préférez en parler de vive voix ? L'agence vous reçoit au ${SITE.address.street} à ${SITE.address.city}. Horaires : ${SITE.hours.toLowerCase()}.`,
        ],
      },
      {
        title: 'Vente accompagnée ou reprise : deux options',
        paragraphs: [
          "La vente accompagnée vise le meilleur prix : nous vendons votre voiture à un particulier, et vous continuez à l'utiliser jusqu'à la vente. La reprise vise la rapidité : nous vous faisons une offre de rachat ferme, valable plusieurs jours, avec un paiement sécurisé.",
          "Vous hésitez ? Demandez une estimation : elle vous donne la valeur de vente de votre voiture, et vous décidez ensuite.",
        ],
      },
      {
        title: 'Les documents à préparer',
        bullets: [
          'La carte grise à votre nom',
          "Votre pièce d'identité",
          'Le contrôle technique de moins de six mois, si la voiture a plus de quatre ans',
          "Le carnet d'entretien et les factures",
          'Les doubles des clés',
        ],
        paragraphs: [
          'Nous nous chargeons du certificat de situation administrative et de la déclaration de cession. De votre côté, prévoyez :',
        ],
      },
    ],
    faq: [
      {
        q: "Peut-on vous rencontrer à l'agence ?",
        a: `Oui, au ${SITE.address.street} à ${SITE.address.city}. Horaires : ${SITE.hours.toLowerCase()}. Appelez-nous avant de venir pour que votre conseiller soit disponible.`,
      },
      {
        q: 'Rachetez-vous les voitures en panne ?',
        a: "Non. Nous traitons uniquement les véhicules en état de rouler, quels que soient leur âge et leur kilométrage.",
      },
      {
        q: 'Combien coûte le service ?',
        a: "L'estimation est gratuite. Notre commission est fixée avec vous et prélevée uniquement le jour de la vente : si la voiture n'est pas vendue, vous ne payez rien.",
      },
    ],
    related: ['/estimation', '/reprise', '/vendre-voiture-credit-loa-montlucon'],
  },

  {
    slug: 'vendre-sa-voiture-rapidement-montlucon',
    kind: 'service',
    updated: '2026-11-09',
    metaTitle: 'Vendre sa voiture rapidement à Montluçon | Transakauto',
    metaDescription:
      'Besoin de vendre vite ? Offre de reprise ferme sous 24h ou vente accompagnée en 22 jours en moyenne. Paiement sécurisé et démarches incluses, à Montluçon.',
    label: 'Vendre sa voiture rapidement',
    eyebrow: 'Vente rapide · Montluçon',
    title: 'Vendre sa voiture rapidement à Montluçon, sans la brader',
    intro:
      "Un déménagement, un nouveau véhicule à financer, un crédit à solder : quand il faut vendre vite, la tentation est d'accepter la première offre venue. Nous vous proposons deux voies rapides, et nous vous aidons à choisir celle qui vous rapporte le plus.",
    serviceType: 'Reprise et vente rapide de véhicule d’occasion',
    sections: [
      {
        title: 'Vendre vite : trois solutions, trois niveaux de prix',
        table: {
          head: ['Solution', 'Délai', 'Prix obtenu'],
          rows: [
            ['Vendre seul entre particuliers', 'Imprévisible : de quelques jours à plusieurs mois', 'Le meilleur, si vous trouvez le bon acheteur'],
            ['Rachat ou reprise par un professionnel', 'Quelques jours', 'Plus bas : la marge du professionnel est déduite'],
            ['Vente accompagnée Transakauto', '22 jours en moyenne', 'Le prix du marché entre particuliers'],
          ],
        },
      },
      {
        title: 'Le « rachat cash » : ce qu’il faut savoir',
        paragraphs: [
          "Les offres de rachat « cash » promettent un paiement immédiat. En pratique, la loi interdit à un professionnel de payer en espèces au-delà de 1 000 € : « cash » veut donc dire virement ou chèque de banque, comme partout ailleurs.",
          "Leur vrai atout est la rapidité. Leur limite est le prix : le professionnel qui rachète doit préparer, garantir et revendre la voiture, et il déduit tout cela de son offre. Sur un véhicule récent, l'écart avec une vente entre particuliers se compte souvent en milliers d'euros.",
          'Avant d’accepter une offre, demandez-la par écrit, vérifiez qui rachète, et comparez-la à une estimation de vente : vous saurez exactement combien coûte la rapidité.',
        ],
      },
      {
        title: 'Notre reprise ferme : la voie la plus rapide',
        bullets: [
          'Une proposition chiffrée sous 24h ouvrées',
          'Une offre ferme, valable plusieurs jours, sans engagement',
          'Un paiement sécurisé, après vérification du véhicule et des documents',
          'Le crédit ou la LOA soldé directement dans la transaction',
          'Carte grise, déclaration de cession et certificat de situation administrative pris en charge',
        ],
        link: { href: '/reprise', label: 'Demander une offre de reprise' },
      },
      {
        title: 'La vente accompagnée : rapide, et au meilleur prix',
        paragraphs: [
          "Si vous pouvez attendre quelques semaines, la vente accompagnée rapporte davantage : 22 jours en moyenne pour un véhicule au bon prix. Pendant ce temps, vous gardez votre voiture et vous continuez à l'utiliser, et vous ne payez rien si elle n'est pas vendue.",
          "Vous hésitez entre les deux ? Nous chiffrons la reprise et la vente : vous voyez l'écart, et vous choisissez.",
        ],
        link: { href: '/estimation', label: 'Demander une estimation gratuite' },
      },
      {
        title: 'Cinq conseils pour vendre plus vite',
        bullets: [
          'Fixer le bon prix dès le départ : une voiture trop chère reste en ligne, puis finit bradée',
          'Passer le contrôle technique avant la mise en vente : il est obligatoire au-delà de quatre ans et doit dater de moins de six mois',
          "Rassembler le carnet d'entretien et les factures",
          "Nettoyer l'intérieur et l'extérieur avant les photos",
          'Retrouver les doubles des clés',
        ],
        link: { href: '/documents-pour-vendre-sa-voiture', label: 'Voir la liste des documents' },
      },
    ],
    faq: [
      {
        q: 'Combien de temps faut-il pour vendre sa voiture ?',
        a: "Avec une reprise ferme, notre offre arrive sous 24h ouvrées et la transaction peut être bouclée en quelques jours. En vente accompagnée, comptez 22 jours en moyenne pour un véhicule au bon prix.",
      },
      {
        q: 'Peut-on être payé en espèces ?',
        a: "Pas au-delà de 1 000 € : la loi interdit à un professionnel de régler en espèces une somme supérieure. Le paiement se fait par un moyen sécurisé, après vérification du véhicule et des documents.",
      },
      {
        q: 'La reprise rapporte-t-elle moins qu’une vente ?',
        a: "En général un peu moins, car le professionnel doit préparer et revendre la voiture. Si vous pouvez attendre quelques semaines, la vente accompagnée rapporte davantage. Nous vous chiffrons les deux pour que vous choisissiez.",
      },
    ],
    related: ['/reprise', '/estimation', '/depot-vente-voiture-montlucon'],
  },

  {
    slug: 'voiture-occasion-montlucon',
    kind: 'service',
    updated: '2026-11-09',
    metaTitle: "Acheter une voiture d'occasion à Montluçon | Transakauto",
    metaDescription:
      "Voitures d'occasion de particuliers, vendues par notre agence de Montluçon : dossier vérifié, garantie 3 mois incluse, paiement sécurisé. Recherche sur demande.",
    label: "Voitures d'occasion",
    eyebrow: "Achat · Voitures d'occasion",
    title: "Acheter une voiture d'occasion à Montluçon, en toute confiance",
    intro:
      "Les voitures que nous vendons appartiennent à des particuliers qui nous ont confié leur vente. Vous achetez la voiture d'un particulier, avec l'accompagnement d'une agence : dossier vérifié, garantie incluse et paiement sécurisé.",
    serviceType: "Vente de véhicules d'occasion",
    primaryCta: { href: SITE.stockUrl, label: 'Voir les voitures disponibles' },
    sections: [
      {
        title: 'Le prix d’un particulier, la sécurité d’une agence',
        paragraphs: [
          "Acheter à un particulier, c'est souvent un bon prix, mais aussi des risques : historique incertain, papiers incomplets, aucun interlocuteur en cas de problème. Acheter en garage, c'est plus sûr, mais plus cher.",
          "Avec Transakauto Montluçon, vous achetez la voiture d'un particulier dont les papiers ont été vérifiés par l'agence, avec un conseiller qui vous accompagne de l'essai jusqu'à la remise des clés.",
        ],
      },
      {
        title: 'Ce qui est compris',
        bullets: [
          'Une garantie de 3 mois moteur, boîte et pont, extensible à 6, 12 ou 24 mois',
          'Le nettoyage du véhicule avant la remise des clés',
          '20 € de carburant pour vos premiers kilomètres',
          'Un paiement par virement, sur une plateforme de paiement sécurisée',
          'Un dossier administratif vérifié : certificat de situation administrative, contrôle technique, certificat de cession',
        ],
        paragraphs: ["Compris dans les frais d'intermédiation, indiqués sur chaque annonce :"],
      },
      {
        title: 'Les voitures disponibles',
        paragraphs: [
          "Notre stock évolue au fil des ventes que les particuliers nous confient. Les véhicules disponibles sont en ligne sur la page de l'agence, sur le site du réseau Transakauto.",
        ],
        link: { href: SITE.stockUrl, label: 'Voir les voitures disponibles' },
      },
      {
        title: 'Vous cherchez un modèle précis ?',
        paragraphs: [
          'Dites-nous ce que vous cherchez : marque, modèle, budget, kilométrage. Le réseau Transakauto recherche pour vous, et nous vous prévenons dès qu’un véhicule correspondant est disponible.',
          `Appelez-nous au ${SITE.phoneDisplay} ou écrivez-nous à ${SITE.email}.`,
        ],
      },
      {
        title: 'Vous avez une voiture à vendre ?',
        paragraphs: [
          'Nous pouvons vendre votre voiture actuelle pour vous, ou vous en faire une offre de reprise. Demandez une estimation gratuite : elle vous aide à boucler votre budget.',
        ],
        link: { href: '/estimation', label: 'Estimer ma voiture actuelle' },
      },
    ],
    faq: [
      {
        q: "D'où viennent vos voitures ?",
        a: "De particuliers de Montluçon et de la région, qui nous ont confié la vente de leur véhicule. Les papiers sont vérifiés par l'agence avant la vente.",
      },
      {
        q: 'Les voitures sont-elles garanties ?',
        a: 'Oui : une garantie de 3 mois moteur, boîte et pont est comprise. Vous pouvez l’étendre à 6, 12 ou 24 mois.',
      },
      {
        q: 'Comment se fait le paiement ?',
        a: 'Par virement, sur une plateforme de paiement sécurisée. Les clés vous sont remises une fois le paiement confirmé.',
      },
      {
        q: 'Peut-on essayer la voiture avant d’acheter ?',
        a: 'Oui. Votre conseiller organise l’essai avec vous et répond à vos questions sur l’historique du véhicule.',
      },
    ],
    related: ['/estimation', '/reprise', '/vendre-voiture-credit-loa-montlucon'],
  },

  {
    slug: 'documents-pour-vendre-sa-voiture',
    kind: 'guide',
    updated: '2026-11-09',
    metaTitle: 'Documents pour vendre sa voiture : la liste | Transakauto',
    metaDescription:
      'Carte grise, contrôle technique, certificat de cession, non-gage, code de cession : tous les documents pour vendre votre voiture, et les démarches après la vente.',
    label: 'Documents pour vendre sa voiture',
    eyebrow: 'Guide · Démarches',
    title: 'Documents pour vendre sa voiture : la liste complète',
    intro:
      "Vendre une voiture demande quelques papiers, et une démarche à faire après la vente. Voici la liste complète, à quoi sert chaque document, et ce que nous prenons en charge quand vous vendez avec Transakauto Montluçon.",
    serviceType: 'Guide des démarches de vente d’un véhicule',
    sections: [
      {
        title: 'Avant la vente : les documents à réunir',
        bullets: [
          'La carte grise (certificat d’immatriculation) à votre nom.',
          'Un contrôle technique de moins de six mois, obligatoire si la voiture a plus de quatre ans.',
          "Un certificat de situation administrative de moins de quinze jours, dit certificat de non-gage : il prouve que la voiture n'est ni gagée ni frappée d'opposition.",
          "Le carnet d'entretien et les factures : ils ne sont pas obligatoires, mais ils rassurent l'acheteur et défendent votre prix.",
          'Les doubles des clés.',
        ],
      },
      {
        title: 'Le jour de la vente',
        bullets: [
          'Le certificat de cession (cerfa n° 15776), rempli en deux exemplaires et signé par le vendeur et l’acheteur.',
          'La carte grise barrée, avec la mention « Vendu le », la date et l’heure de la vente, et votre signature. Elle est remise à l’acheteur.',
          'Le code de cession, obtenu en déclarant la vente en ligne : l’acheteur en a besoin pour faire établir la carte grise à son nom.',
        ],
      },
      {
        title: 'Après la vente : déclarer la cession',
        paragraphs: [
          "Vous devez déclarer la vente dans les quinze jours, en ligne sur le site de l'ANTS. Tant que ce n'est pas fait, les amendes liées à la voiture peuvent encore vous être adressées.",
          "Prévenez aussi votre assureur : le contrat est suspendu automatiquement le lendemain de la vente, à zéro heure, et vous pouvez ensuite le résilier.",
        ],
      },
      {
        title: 'Les cas particuliers',
        bullets: [
          "Voiture en crédit avec un gage : le gage doit être levé par l'organisme de crédit avant la vente.",
          "Voiture en LOA : elle appartient à la société de financement, il faut d'abord lever l'option d'achat.",
          'Carte grise perdue ou volée : il faut demander un duplicata en ligne avant de vendre.',
        ],
        link: { href: '/vendre-voiture-credit-loa-montlucon', label: 'Vendre une voiture en crédit ou en LOA' },
      },
      {
        title: 'Ce que nous faisons pour vous',
        paragraphs: [
          "Quand vous vendez avec Transakauto Montluçon, nous demandons le certificat de situation administrative, préparons le certificat de cession et effectuons la déclaration de cession dans les délais. Vous n'avez qu'à fournir votre carte grise, votre pièce d'identité et le contrôle technique.",
        ],
        link: { href: '/estimation', label: 'Demander une estimation gratuite' },
      },
    ],
    faq: [
      {
        q: 'Le contrôle technique est-il obligatoire pour vendre ?',
        a: 'Oui, si la voiture a plus de quatre ans : le procès-verbal doit dater de moins de six mois le jour de la vente.',
      },
      {
        q: 'Combien de temps a-t-on pour déclarer la vente ?',
        a: "Quinze jours, en ligne sur le site de l'ANTS. Avec Transakauto Montluçon, nous nous en chargeons.",
      },
      {
        q: 'Où obtenir le certificat de non-gage ?',
        a: "En ligne et gratuitement, sur les sites officiels du ministère de l'Intérieur, avec les informations de la carte grise. Il doit dater de moins de quinze jours le jour de la vente.",
      },
    ],
    related: ['/estimation', '/vendre-sa-voiture-rapidement-montlucon', '/vendre-voiture-credit-loa-montlucon'],
  },
]

export function getLandingPage(slug: string): LandingPageContent | undefined {
  return LANDING_PAGES.find((page) => page.slug === slug)
}

/** Pages « ville », pour le pied de page et la zone d'intervention de l'accueil. */
export const CITY_PAGES = LANDING_PAGES.filter((page) => page.kind === 'city')
