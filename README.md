# ADDITIVE — Plateforme e-commerce

> Lunetterie modulaire imprimée en 3D · Montréal
> Refonte complète du site WordPress/WooCommerce en plateforme Next.js autonome :
> front-office premium animé + back-office administrable + configurateur « Créer ma monture ».

## Stack

| Couche | Technologie |
| --- | --- |
| Framework | Next.js 14 (App Router) + TypeScript strict |
| Styles | Tailwind CSS + design system maison (palette, typo Inter / Space Grotesk) |
| Animations | Framer Motion (reveal, parallaxe, magnetic buttons, canvas génératif) |
| UI | Composants style shadcn/ui (cva + tailwind-merge) + Lucide React |
| Données | Prisma + PostgreSQL (Neon / Supabase / Vercel Postgres) |
| Auth admin | NextAuth (credentials + JWT, bcrypt) |
| Validation | Zod + React Hook Form |
| Médias | URL ou upload direct Cloudinary (préréglage unsigned), compatible UploadThing |
| Déploiement | Vercel + GitHub |

## 1. Installation locale

```bash
git clone <votre-repo> additive && cd additive
npm install
cp .env.example .env        # Windows : copy .env.example .env
```

## 2. Configuration `.env`

| Variable | Rôle |
| --- | --- |
| `DATABASE_URL` | PostgreSQL (Neon : `postgresql://...neon.tech/additive?sslmode=require`) |
| `NEXTAUTH_SECRET` | Secret de session (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | `http://localhost:3000` en local, l’URL Vercel en prod |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Compte admin créé par le seed |
| `NEXT_PUBLIC_CLOUDINARY_*` | (Optionnel) upload direct des médias |
| `NEXT_PUBLIC_SITE_URL` | URL publique (SEO, sitemap) |

## 3. Base de données

```bash
npm run db:push    # crée les tables (Prisma)
npm run db:seed    # importe 3 collections, 14 produits, contenus + admin
```

> **Mode démo** : sans base de données, le site public reste consultable
> (catalogue et contenus servis depuis `content/static-data.ts`). Le back-office,
> lui, nécessite une vraie base.

## 4. Lancement

```bash
npm run dev        # http://localhost:3000
npm run studio     # Prisma Studio (inspection des données)
```

## 5. Accès admin

- URL : `http://localhost:3000/admin`
- Identifiants : ceux de `ADMIN_EMAIL` / `ADMIN_PASSWORD` (défaut seed : `admin@additive.ca` / `additive2026` — **à changer en production**).

Modules : tableau de bord, produits (CRUD + galerie + SEO + publication),
collections, médiathèque, contenus éditoriaux (hero, slogans, manifeste,
technologie, FAQ, CTA), demandes clients (contact + personnalisations issues
du configurateur, avec statut et note interne), paramètres.

## 6. Déploiement Vercel

1. Pousser le repo sur GitHub :
   ```bash
   git init && git add -A && git commit -m "ADDITIVE v1"
   git remote add origin git@github.com:<vous>/additive.git
   git push -u origin main
   ```
2. Sur [vercel.com](https://vercel.com) : **Add New Project** → importer le repo (framework auto-détecté : Next.js).
3. Créer une base Postgres (Neon / Vercel Postgres / Supabase) et renseigner les variables d’environnement du tableau ci-dessus dans Vercel (`NEXTAUTH_URL` = URL du déploiement).
4. Déployer, puis initialiser la base depuis votre poste :
   ```bash
   DATABASE_URL="<url-prod>" npm run db:push
   DATABASE_URL="<url-prod>" npm run db:seed
   ```
   (PowerShell : `$env:DATABASE_URL="<url-prod>"; npm run db:push; npm run db:seed`)

Le `npm run build` exécute `prisma generate` automatiquement (`postinstall` + script `build`).

## 7. Structure du projet

```txt
app/
  (public)/            Front-office : accueil, collections, produits,
                       personnalisation (configurateur), technologie,
                       manifeste, about, contact
  admin/
    login/             Connexion admin
    (protected)/       Dashboard, produits, collections, médias,
                       contenus, demandes, paramètres
  api/                 REST : contact, configurateur (estimation serveur),
                       customization, admin CRUD, auth
components/
  ui/                  Boutons, inputs, cards… (style shadcn/ui)
  layout/              Navbar, footer, logo
  sections/            Hero, techno, manifeste, CTA, formulaire contact
  product/             Cartes, grilles, galerie, filtres, détails
  configurator/        Parcours « Créer ma monture »
  motion/              FadeIn, AnimatedText, RevealImage, MagneticButton,
                       Parallax, HeroCanvas (flow-field génératif)
  admin/               Sidebar, topbar, DataTable, formulaires, uploader
lib/                   db, auth, seo, utils, validations (Zod),
                       catalog (accès données + mode démo), configurator
content/static-data.ts Contenu initial (catalogue WordPress migré)
prisma/                schema.prisma + seed.ts
public/images/         Visuels SVG placeholder (régénérables :
                       node scripts/generate-placeholders.mjs)
```

## 8. Le configurateur « Créer ma monture »

Portage des principes du plugin WordPress **« ADDITIVE Créer mes lunettes »** :

- **Parcours par étapes** : intro → consentement → morphologie → style →
  profil → concepts → estimation → demande (`lib/configurator.ts`, `STEP_ORDER`).
- **Consentement explicite** requis avant tout traitement de données.
- **Diagnostic de style indirect** : questionnaire lifestyle converti en tags
  esthétiques (`answersToProfile`) — jamais un « diagnostic » de personnalité.
- **3 concepts maximum**, générés par la matrice morphologie × style × audace
  et triés par **score d’imprimabilité décroissant**. La collection réelle
  inspire, mais n’est jamais proposée telle quelle.
- **Estimation toujours recalculée côté serveur** (`/api/configurator/estimate`
  et au moment de l’enregistrement de la demande) — le client n’affiche jamais
  un prix qu’il a calculé lui-même. Aucun frais « génération IA ».
- **Anonymat des fournisseurs IA** : aucun nom de provider côté client ;
  les erreurs renvoient des messages génériques (`unavailable`), les détails
  restent dans les logs serveur.
- **Architecture prête** pour les modules à venir : analyse faciale live
  (landmarks, mesures calibrées), moodboard génératif, essayage AR fidèle au
  concept, aperçu 3D. Les demandes sont stockées (`CustomizationRequest`) avec
  profil complet + panneau atelier dans l’admin.

## 9. Scripts npm

```json
{
  "dev": "next dev",
  "build": "prisma generate && next build",
  "start": "next start",
  "lint": "next lint",
  "db:push": "prisma db push",
  "db:seed": "tsx prisma/seed.ts",
  "studio": "prisma studio"
}
```

## 10. Aller plus loin

- **Paiement** : le modèle (`Product.price`, demandes avec estimation) est prêt
  pour Stripe Checkout ; brancher une route `/api/checkout` suffira.
- **Variantes produit** : étendre `Product` avec un modèle `Variant`
  (taille / verre / branche) — le schéma actuel est conçu pour l’accueillir.
- **Médias** : remplacer les SVG placeholder par les photos produits via
  `/admin/media` (Cloudinary ou URLs).
- **Vidéo hero** : téléverser la vidéo de marque et remplacer le canvas
  génératif dans `components/sections/hero-section.tsx`.
