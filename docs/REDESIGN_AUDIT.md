# ADDITIVE — Audit de redesign (Phase 1)

> État au 13 juin 2026. Site déployé : https://additive-blue.vercel.app
> Stack : Next.js 14 (App Router) · TypeScript strict · Tailwind · Framer Motion · Prisma/PostgreSQL (Neon) · NextAuth.

## 1. État actuel

Le site existe déjà comme **plateforme Next.js complète** (refonte du WordPress) :
front-office premium animé, back-office administrable, configurateurs IA, base
PostgreSQL connectée. Ce n'est pas un template générique — la base est saine.

**Pages publiques** : `/`, `/collections` (+ `/collections/[slug]`), `/produits`
(+ `/produits/[slug]`), `/personnalisation` (configurateur IA), `/personnalisation/modulair`
(MODUL'AIR), `/technologie`, `/manifeste`, `/about`, `/contact`.
**Admin** : dashboard, produits (CRUD + galerie + 3D), collections, médias,
contenus, configurateur (providers IA, prix, MODUL'AIR, consentement), demandes, paramètres.

## 2. Forces (à conserver)

- **Architecture data-driven** : produits/collections/contenus en base, repli statique (`content/static-data.ts`) ; aucune donnée codée en dur dans les composants.
- **Configurateur IA « Créer ma monture »** : analyse faciale MediaPipe live, moodboard, 3 concepts, essayage AR (One-Euro), portrait porté fidèle, prix serveur. Multi-provider IA par tâche (Nano Banana Pro/2), anonymisé.
- **MODUL'AIR « Moduler mes lunettes »** : configurateur modulaire, aperçu SVG live, rendu IA, AR, portrait, **config admin des éléments**.
- **3D produit** : `<model-viewer>` (rotation/zoom/AR), 26 modèles GLB importés.
- **Design system** : tokens CSS (palette, dark mode), composants UI (cva), motion (FadeIn, AnimatedText, RevealImage, MagneticButton, Parallax).
- **SEO** : `buildMetadata`, sitemap, robots, métadonnées par page.
- **Catalogue réel** : 22 produits importés du WordPress (images, prix, collections, 3D).

## 3. Faiblesses (à corriger dans le redesign)

| # | Faiblesse | Priorité |
|---|---|---|
| F1 | **Palette à aligner** sur la nouvelle charte (`--additive-blue: #1557ff`, `--signal-orange: #ff5a36`, `--ink`, `--paper`…). L'actuelle est proche mais pas identique. | Haute |
| F2 | **Trop de « cartes dans des rectangles arrondis »** — le brief demande des compositions éditoriales asymétriques, pleines surfaces, typographie monumentale. | Haute |
| F3 | **Médias hébergés sur buypukka.ca** (ancien WordPress) → dépendance externe. À rapatrier (Cloudinary). | Haute |
| F4 | **Pas encore de** `/shop`, `/configurator` (route dédiée distincte de la home), `/virtual-try-on`, `/process`, `/lookbook`, `/journal`, `/faq`, `/retailers`, `/cart`, `/account`. | Moyenne |
| F5 | **Multilingue FR/EN** non implémenté (architecture à préparer : `Locale`, chaînes centralisées). | Moyenne |
| F6 | **Header** ne se masque/réapparaît pas au scroll (hide-on-scroll-down). | Basse |
| F7 | **WooCommerce / panier / compte** absents (e-commerce transactionnel). Actuellement : « ajouter à l'atelier » = demande. | Moyenne |
| F8 | **Manifeste de marque** « Not made for everyone. Made for you. » pas encore central. | Moyenne |
| F9 | **Lookbook éditorial** (galerie portraits pleine hauteur) absent. | Moyenne |
| F10 | **Message « SCAN → DESIGN → PRINT → FINISH → WEAR »** (séquence process) à formaliser en page `/process`. | Basse |

## 4. Composants à conserver

`HeroSection`, `CollectionCard`, `ProductCard/Grid/Gallery/Details`, `Model3DViewer`,
tout le dossier `components/configurator/*` (Créer ma monture + MODUL'AIR + face-scanner/tryon),
`components/motion/*`, `components/admin/*`, `lib/*` (catalog, configurator, modulair, ai/*, face/*).

## 5. Composants à (re)construire pour le redesign

- **Design tokens** alignés sur la charte (couleurs F1, `motionTokens`).
- **Nav** premium hide-on-scroll + menu plein écran mobile + recherche/compte/panier.
- **Hero** « Lunettes imprimées en 3D. Conçues autour de vous. » + média fort (rendu/vidéo) + parallaxe souris.
- **Manifeste** typographique « Votre visage n'est pas standard… » (révélation ligne par ligne, mot bleu changeant).
- **3 expériences collection** distinctes (MODUL'AIR vue éclatée, GENERATIVE génératif, HYBRIDE matières).
- **Section process** `SCAN → DESIGN → PRINT → FINISH → WEAR`.
- **Lookbook** galerie éditoriale + lightbox.
- **Footer** composition éditoriale + infolettre + FR/EN.
- **Pages** : `/shop`, `/lookbook`, `/process`, `/journal`, `/faq`, `/retailers`.

## 6. Contenus manquants / à confirmer

Voir `docs/CONTENT_GAPS.md` (prix par variante, dimensions par modèle, délais de
fabrication, compatibilité verres, arguments environnementaux chiffrés, politiques
livraison/retours/entretien, témoignages, détaillants). **Aucune donnée inventée.**

## 7. Améliorations UX prioritaires

1. Clarifier en < 5 s : 3D + modulaire + 3 collections + parcours personnalisation.
2. Distinguer visuellement MODUL'AIR / GENERATIVE / HYBRIDE (3 ADN).
3. Parcours conversion : « Créer mes lunettes » omniprésent mais non intrusif.
4. Mobile = produit d'abord, configurateur simplifié, navigation au pouce.
5. Indépendance médias (Cloudinary) + perfs (AVIF/WebP, import dynamique 3D).

## 8. Nouvelle direction artistique (résumé)

Minimalisme expressif, composition éditoriale asymétrique, typographie monumentale
(`Space Grotesk`/`Inter`), grandes surfaces, alternance clair/sombre maîtrisée,
bleu `#1557ff` identitaire, orange `#ff5a36` signal uniquement. Produits traités
comme des sculptures. Motion qui explique la matérialité, jamais gratuit.
`prefers-reduced-motion` respecté. Message : **« Pas conçues pour tout le monde. Conçues pour vous. »**

## 9. Plan d'exécution proposé (phasé, chaque phase déployable)

- **Phase 2 — Fondations** : tokens charte + `motionTokens` + nav hide-on-scroll + footer éditorial + architecture i18n FR/EN.
- **Phase 3 — Accueil** : hero, manifeste, 3 collections, process, vedettes (data), section matière, lookbook, CTA final.
- **Phase 4 — Pages internes** : collections redesign, `/shop`, fiche produit premium, `/process`, `/lookbook`, `/faq`, `/retailers`, `/journal`.
- **Phase 5 — Configurateur** : route `/configurator` dédiée (8 étapes, état centralisé, URL partageable, persistance locale, états de chargement/erreur).
- **Phase 6 — E-commerce** : panier/compte (intégration WooCommerce ou Stripe).
- **Phase 7 — Qualité** : audit a11y WCAG 2.2 AA, perfs (LCP/CLS/INP), SEO structuré (Product/Org/Breadcrumb/FAQ), build + déploiement.

> Chaque phase est un ou plusieurs incréments compilables et déployables — jamais un big-bang.
