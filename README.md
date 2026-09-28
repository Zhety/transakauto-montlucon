# Transakauto Montluçon — site d'acquisition de leads

Site vitrine + acquisition de leads pour l'agence d'intermédiation automobile Transakauto Montluçon
(TFM AUTO, 56 rue Eugène Sue, 03100 Montluçon).
Trois pages utiles : accueil, demande d'estimation, demande de reprise. Chaque demande part par email.

Stack : Next.js 15 (App Router) · React 19 · Tailwind 4 · nodemailer · zod.

## Démarrer

```bash
npm install
cp .env.local.example .env.local   # puis remplir les valeurs
npm run dev                        # http://localhost:3200
```

## Configurer la réception des demandes

Tout se passe dans `.env.local` :

| Variable | Rôle |
| --- | --- |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` | serveur d'envoi (Gmail : `smtp.gmail.com`, port `465`, mot de passe **d'application**) |
| `LEADS_NOTIFY_TO` | adresse(s) qui reçoivent les demandes, séparées par des virgules |
| `LEADS_NOTIFY_FROM` | expéditeur affiché (doit être autorisé par le SMTP) |
| `LEADS_SEND_CONFIRMATION` | `false` pour couper l'accusé de réception envoyé au client |
| `NEXT_PUBLIC_SITE_URL` | URL publique (sitemap, liens des emails) |
| `NEXT_PUBLIC_NOINDEX` | `true` bloque l'indexation Google (robots.txt + meta) |
| `NEXT_PUBLIC_GOOGLE_ADS_ID` | compte Google Ads `AW-xxxxxxxxx` ; vide = aucune balise, aucun cookie |
| `NEXT_PUBLIC_ADS_CONVERSION_LABEL` | libellé de l'action de conversion « Demande envoyée » |

Sans SMTP configuré, le site fonctionne quand même : les demandes sont validées, archivées dans
`.leads.jsonl` et un message est écrit dans les logs. Rien n'est perdu.

Chaque demande envoie deux emails : le récapitulatif complet à l'agence (avec `Reply-To` sur le
client, donc « Répondre » écrit directement au vendeur) et un accusé de réception au client.

## Identité visuelle

Charte du réseau Transakauto : noir `#000000`, magenta `#EC008C`, fond clair `#F5F9FF`, gris
`#8E949D`, police Poppins — tokens dans [`src/app/globals.css`](src/app/globals.css).
Le logo officiel (`public/transakauto-logo.png`) a un lettrage blanc sur fond transparent : il
impose un fond sombre, d'où le header noir.

## Coordonnées de l'agence

Toutes les informations affichées (téléphone, email, adresse, SIRET, RCS…) sont centralisées dans
[`src/lib/site.ts`](src/lib/site.ts). Elles apparaissent sur le site, dans les emails, dans les
mentions légales et dans les données structurées de la page d'accueil.

Données société vérifiées au registre national des entreprises :

| | |
| --- | --- |
| Raison sociale | TFM AUTO (SAS) |
| Siège / agence | 56 rue Eugène Sue, 03100 Montluçon |
| SIREN / SIRET | 939 743 308 / 939 743 308 00016 |
| RCS | Montluçon 939 743 308 |
| TVA | FR14 939 743 308 |
| APE | 45.11Z — commerce de voitures et de véhicules automobiles légers |
| Immatriculation | 15 janvier 2025 |
| Direction | François Gayon et Théo Malochet |
| Téléphone | 06 14 90 25 48 (conforme à la fiche PagesJaunes) |
| Email | contact@transakautomontlucon.com |
| Horaires | mardi-vendredi 10h-18h30, samedi 10h-17h (lundi et dimanche fermés) |

## Questions des formulaires

Le schéma unique des deux formulaires est dans [`src/lib/lead.ts`](src/lib/lead.ts) (zod). Les deux
parcours posent exactement les mêmes questions, seul `intent` change (`estimation` / `reprise`) :

1. **Véhicule** — marque, modèle, version, année, kilométrage, énergie, boîte, immatriculation
2. **État et projet** — état général, contrôle technique, carnet d'entretien, première main,
   accidenté, situation (payé / crédit / LOA), prix espéré, échéance de vente
3. **Coordonnées** — prénom, nom, email, téléphone, code postal, ville, message, consentement RGPD

Pour ajouter un champ : l'ajouter au schéma zod, à `leadRows()` (récap email) et au formulaire
[`src/components/lead-form.tsx`](src/components/lead-form.tsx).

## Déploiement Vercel

```bash
npx vercel        # première fois : lie le projet
npx vercel --prod
```

Reporter les variables d'environnement dans Vercel → Settings → Environment Variables.
Sur Vercel le système de fichiers est en lecture seule : l'archive `.leads.jsonl` n'y est pas
écrite, l'email est le seul canal — d'où l'importance de tester le SMTP après le premier déploiement.

## Prêt pour les ads

- Les paramètres `utm_*`, `gclid` et `fbclid` présents dans l'URL sont capturés et affichés dans
  l'email (ligne « Campagne ») : on sait d'où vient chaque lead.
- `/merci` est la page de conversion, en `noindex`. C'est l'URL à déclarer comme conversion dans
  Google Ads / Meta. Le tag de conversion se pose dans
  [`src/app/merci/page.tsx`](src/app/merci/page.tsx).
- `/estimation` et `/reprise` sont des landing pages autonomes : elles peuvent servir de
  destination directe aux annonces.
- Mentions légales et politique de confidentialité sont en place — Google Ads les exige.

## Anti-spam

Champ leurre caché (`website`) dans le formulaire : s'il est rempli, la route répond `ok` sans
envoyer d'email, pour ne pas indiquer au robot ce qui l'a démasqué.

## Google Ads — configuration de référence

**Toute modification se fait ici d'abord, puis dans l'interface.** Ne pas improviser :
ces valeurs sont la source de vérité, alignées sur le compte de Metz.

| | Montluçon | (Metz, pour mémoire) |
| --- | --- | --- |
| Campagne | `Recherche — Vendeurs — Montluçon` | `Recherche — Vendeurs — Metz Nancy` |
| Budget | 10 €/jour | 10 €/jour |
| Enchères | Maximiser les clics, CPC max 1 € | idem |
| URL finale | `https://transakautomontlucon.com/estimation` | — |
| Chemin à afficher | `estimation` / `gratuite` | `estimation` / `gratuite` |
| Extension d'appel | aucune (choix de l'agence) | — |
| Conversion | « Demande envoyée » sur `/merci` | idem |

### Titres (30 caractères max)

```
Vendre sa voiture à Montluçon
Estimation gratuite sous 24h
Nous vendons votre voiture
Estimez votre voiture en 2 min
Combien vaut votre voiture ?
Aucun frais avant la vente
Transakauto Montluçon
Vente sécurisée et sans risque
Le prix du particulier
On gère visites et essais
Paiement vérifié avant remise
Crédit ou LOA en cours ? OK
Toutes marques, tout km
Papiers pris en charge
Vous gardez votre voiture
```

### Descriptions (90 caractères max)

```
Estimation gratuite sous 24h. Nous vendons votre voiture à votre place, en sécurité.
Photos, annonce, visites, essais, paiement : on gère tout. Vous encaissez le prix.
Commission due uniquement le jour de la vente. Véhicule non vendu, vous ne payez rien.
Agence à Montluçon. Toutes marques, tout kilométrage, crédit ou LOA en cours accepté.
```

### Liens annexes (texte 25 car., descriptions 35 car.)

Règle : **tous les liens annexes mènent à un formulaire.** Pas de FAQ ni de page
d'explication — un clic payé qui n'aboutit pas à une demande est un clic perdu.

| Texte | Description 1 | Description 2 | URL |
| --- | --- | --- | --- |
| Estimation gratuite | Réponse sous 24h, sans engagement | Deux minutes pour la demande | `/estimation` |
| Combien vaut ma voiture | Prix réel du marché local | Estimation offerte, sans suite | `/estimation#formulaire` |
| Reprise immédiate | Rachat ferme sous 24h | Paiement rapide et sécurisé | `/reprise` |
| Crédit ou LOA en cours | On solde le financement | Vous encaissez la différence | `/reprise#formulaire` |

### Info-bulles / accroches (25 caractères max)

```
Estimation gratuite
Réponse sous 24h
Sans engagement
Zéro frais d'avance
Paiement sécurisé
Toutes marques, tout km
Crédit et LOA acceptés
Papiers pris en charge
Vous gardez votre voiture
Agence à Montluçon
```

Autres composants (images, promotions, prix) : non utilisés. « Options d'URL des
annonces » : laisser vide, le suivi passe par la balise de conversion sur `/merci`.

### Extraits structurés — en-tête « Services » (25 caractères max)

```
Estimation de véhicule
Vente accompagnée
Reprise et rachat
Dépôt-vente
Démarches administratives
Paiement sécurisé
Conseil à la vente
```

### Composants volontairement écartés

| Composant | Pourquoi |
| --- | --- |
| Formulaire de lead | capterait la demande dans Google : ni email, ni passage par `/merci`, donc aucune conversion enregistrée et aucun lead reçu |
| Appels | l'agence ne veut pas de numéro dans les annonces (le site l'affiche toujours) |
| Promotions, Prix | rémunération à la commission, pas de tarif fixe à afficher |
| Messages, Applications | sans objet |
| Modèle de suivi, suffixe d'URL | inutiles : l'étiquetage automatique fournit déjà le `gclid`, capté par le site |

### Mots clés

```
[vendre sa voiture montluçon]
[vendre ma voiture montluçon]
[estimation voiture montluçon]
"vendre sa voiture montluçon"
"vendre sa voiture allier"
"vendre voiture montluçon"
"vendre ma voiture rapidement"
"estimation voiture gratuite"
"estimer ma voiture gratuitement"
"combien vaut ma voiture"
"faire estimer sa voiture"
"reprise voiture montluçon"
"rachat voiture montluçon"
"racheter ma voiture"
"faire reprendre sa voiture"
"vendre voiture credit en cours"
"vendre voiture loa"
"depot vente voiture montluçon"
"mandataire auto montluçon"
"vendre sa voiture sans se deplacer"
```

### Mots clés à exclure

```
-acheter  -achat  -pas cher  -neuve  -neuf  -location  -louer  -epave  -casse
-piece detachee  -leboncoin  -la centrale  -argus  -credit auto  -financement
-controle technique  -carte grise  -emploi  -moto  -scooter  -camping car  -sans permis
```

Ne pas exclure `occasion` : beaucoup de vendeurs écrivent « vendre ma voiture d'occasion ».

## Tableau des leads

Outil interne servi sur `leads.transakautomontlucon.com` : un middleware réécrit ce sous-domaine
vers `/board`, le site public et le tableau vivent donc dans le même déploiement. Les pages
`/board*` n'ont ni en-tête, ni pied de page, ni balise publicitaire, et sont en `noindex`.

- **Connexion** : Supabase Auth, email + mot de passe. Un compte doit exister dans
  Authentication → Users **et** être déclaré dans la table `members`, sinon les règles RLS ne
  laissent rien voir.
- **Kanban** : quatre colonnes — À traiter, Ne répond pas, Non RDV, Oui RDV.
- **Temps réel** : une demande envoyée depuis le site apparaît sans rafraîchir.
- **Fiche détaillée** : elle réutilise `leadRows()`, le récapitulatif des emails.

### Mise en route

1. Créer un projet Supabase **propre à Montluçon** — ne pas réutiliser celui de Metz, la table
   `leads` n'a pas de colonne agence et les demandes se mélangeraient.
2. Exécuter [`supabase/schema.sql`](supabase/schema.sql) dans le SQL Editor.
3. Renseigner `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` et
   `SUPABASE_SERVICE_ROLE_KEY` en local et dans Vercel.
4. Créer les comptes dans Authentication → Users, puis les insérer dans `members` (l'`id` est
   celui du compte).
5. Chez OVH, ajouter un `CNAME` `leads` vers `cname.vercel-dns.com.` (le domaine est déjà
   rattaché au projet Vercel).

La route `/api/lead` écrit en base avec la clé de service, en parallèle de l'envoi des emails :
si Supabase est indisponible, la demande part quand même par email.

### Déploiement depuis ce dossier

Le projet Vercel appartient à l'équipe `transak-metz` (compte de François). Depuis que le dossier
est un dépôt Git au nom de Théo, `npx vercel --prod` est **refusé** : « the commit author doesn't
have permission to create deployments for this project ». Deux contournements :

- ajouter le compte GitHub/Vercel de Théo à l'équipe `transak-metz` (solution durable) ;
- ou masquer le dossier Git le temps du déploiement :
  `mv .git .git-off && npx vercel --yes --prod; mv .git-off .git`

## Leads Meta (formulaires instantanés)

Les formulaires instantanés Facebook / Instagram ne passent pas par le site : le prospect ne le
visite jamais. Meta notifie `POST /api/meta/leads`, qui va chercher le contenu du lead sur l'API
Graph, l'enregistre et prévient l'agence par email — exactement comme une demande du site.

| Variable | Rôle |
| --- | --- |
| `META_APP_SECRET` | signe les notifications ; sans elle tout est refusé (401) |
| `META_VERIFY_TOKEN` | chaîne libre, à saisir à l'identique dans Meta lors de l'abonnement |
| `META_PAGE_ACCESS_TOKEN` | jeton de la Page, avec `leads_retrieval` et `pages_show_list` |

### Mise en route

1. developers.facebook.com → créer une application **Business**, y ajouter le produit
   **Webhooks** et **Connexion Facebook pour les entreprises**.
2. Webhooks → objet **Page** → URL de rappel `https://transakautomontlucon.com/api/meta/leads`,
   jeton de vérification = `META_VERIFY_TOKEN`, puis s'abonner au champ **leadgen**.
3. Générer un jeton d'accès de Page (permissions `leads_retrieval`, `pages_show_list`,
   `pages_manage_metadata`) et l'échanger contre un **jeton longue durée**.
4. Renseigner les trois variables en local et dans Vercel.

### Correspondance des champs

La passerelle reconnaît les questions par leur nom, en français comme en anglais : `full_name`,
`first_name`, `email`, `phone`, `city`, `post_code`, plus `marque`, `modèle`, `année`,
`kilométrage`, `message`. Les caractéristiques absentes restent vides — la migration
[`003_meta_leads.sql`](supabase/migrations/003_meta_leads.sql) les a rendues facultatives.
Le type de demande est déduit du nom du formulaire : « reprise » ou « rachat » dans le titre
donne une demande de reprise, sinon une estimation.

Un lead Meta porte `meta_lead_id`, sous contrainte d'unicité : Meta rejoue les événements non
acquittés, et un même lead ne peut donc pas être inséré deux fois.

### Origine dans le tableau

Chaque fiche du kanban affiche d'où vient la demande — **Meta**, **Google Ads** ou **Site** —
déduite de `meta_lead_id`, puis des paramètres `fbclid` / `gclid` / `utm_source` captés dans
l'URL pour les demandes du site.

## Mise en ligne — reste à faire

Le site est complet et fonctionnel en local. Avant la mise en production :

- [ ] **Domaine** — réserver `transakautomontlucon.com` (valeur par défaut dans
      `next.config.ts`, `.env.local` et l'image de partage). Si un autre domaine est retenu, le
      corriger à ces trois endroits.
- [ ] **SMTP** — créer une boîte propre à l'agence et renseigner `SMTP_*`, `LEADS_NOTIFY_TO` et
      `LEADS_NOTIFY_FROM`. Les identifiants de Metz ne sont volontairement pas repris ici.
      Vérifier avec `npm run test:mail`.
- [ ] **Déploiement** — `npx vercel` puis `npx vercel --yes --prod`, et reporter les variables
      d'environnement dans Vercel → Settings → Environment Variables.
- [ ] **Indexation** — passer `NEXT_PUBLIC_NOINDEX` à `false` une fois le domaine en ligne, puis
      soumettre le sitemap dans Google Search Console.
- [ ] **Google Ads** — créer un compte propre à l'agence, renseigner `NEXT_PUBLIC_GOOGLE_ADS_ID`
      et `NEXT_PUBLIC_ADS_CONVERSION_LABEL` (conversion « Demande envoyée » sur `/merci`).
      Ne pas réutiliser le compte de Metz : les conversions des deux sites se mélangeraient.
- [ ] **Fiche Google Business Profile** — la cohérence nom / adresse / téléphone avec
      `src/lib/site.ts` pèse lourd sur le référencement local.

## Note de dev

`npm run dev` et `next build` ne partagent pas le même dossier de sortie : un build de
vérification se lance avec `NEXT_DIST_DIR=.next-build npx next build`, sinon il écrase le `.next`
du serveur de dev qui répond alors en 500.
