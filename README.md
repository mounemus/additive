# Additive Eyewear

Additive Eyewear est une plateforme e-commerce expérientielle qui fusionne design paramétrique, réalité augmentée et impression 3D. Elle permet aux utilisateurs (B2C) et aux opticiens partenaires (B2B) de co-créer des montures sur mesure.

## Concept Détaillé de l'Application

L'expérience se veut fluide, éliminant la barrière entre le monde physique et digital grâce à un configurateur 3D photoréaliste et un essayage virtuel (VTO - Virtual Try-On) haute fidélité.

## Arborescence Complète (Sitemap)

*   **Accueil** (Hero 3D, Concept, Top Modèles)
*   **Découverte & Catalogue**
    *   Collections (Vue grille, Filtres)
    *   Fiche Modèle
    *   Assistant IA de Style
*   **Expérience de Personnalisation**
    *   Configurateur 3D interactif
    *   Essai Réalité Augmentée (RA)
    *   Outil d'estimation des mesures du visage
*   **Tunnel d'Achat (Checkout)**
    *   Panier
    *   Choix des verres / Upload prescription
    *   Paiement & Confirmation
*   **Espace Client (B2C)**
    *   Mon profil & Mes mesures
    *   Mes créations sauvegardées
    *   Mes commandes & Suivi de fabrication 3D
*   **Espace Partenaires (B2B - Opticiens)**
    *   Dashboard opticiens (Gestion multiclient)
    *   Commandes & Factures
*   **Back-Office Administrateur**
    *   Gestion catalogue (Modèles, textures, prix)
    *   Suivi de production (Statuts d'impression)
    *   Gestion utilisateurs et commandes
*   **Pages Institutionnelles**
    *   La technologie d'impression 3D / Matériaux
    *   FAQ, Contact, Mentions légales

## Parcours Utilisateur (User Journey)

1.  **Inspiration :** L'utilisateur arrive sur le site, découvre le concept via une vidéo 3D fluide et lance l'Assistant IA pour trouver son style.
2.  **Sélection & Configuration :** Il atterrit sur un modèle de base. Dans le configurateur 3D, il modifie la couleur, la finition (ex: nylon fritté mat), et ajuste légèrement la largeur.
3.  **Essai & Validation (RA) :** En un clic sur mobile ou webcam, il essaie les lunettes sur son visage. Le système valide automatiquement la taille (S/M/L) en estimant sa distance pupillaire.
4.  **Commande :** Il ajoute au panier, choisit l'option "Sans verres" ou "Verres de démonstration", puis règle via Stripe.
5.  **Fabrication & Réception :** Il suit l'évolution ("Fichier 3D généré" -> "En impression" -> "Finitions" -> "Expédié"). Il reçoit sa monture unique chez lui.

## Architecture Technique

Cette stack "Modern Headless" garantit performances 3D et évolutivité.

*   **Front-end :** Next.js (React) + Tailwind CSS + Framer Motion (animations).
*   **Moteur 3D :** React Three Fiber (Wrapper React pour Three.js).
*   **Réalité Augmentée :** WebXR (natif) + MediaPipe Face Mesh (Google) pour le fallback web universel (ou MindAR / DeepAR).
*   **Back-end & Base de données :** Supabase (PostgreSQL, Auth, Edge Functions).
*   **Stockage :** Supabase Storage (ou AWS S3) pour les modèles GLTF/GLB et fichiers d'impression (STL).
*   **Paiement :** Stripe (intégré avec Stripe Checkout).
*   **Automatisations :** n8n (workflows pour envoyer les fichiers 3D aux imprimeurs et les emails de suivi aux clients).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
