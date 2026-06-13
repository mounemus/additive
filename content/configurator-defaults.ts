/**
 * Réglages par défaut du configurateur "Créer ma monture".
 *
 * Ces valeurs alimentent à la fois :
 *  - le seed / le repli "mode démo" (sans base de données) ;
 *  - l'interface d'administration (Réglages → Additive), qui les surcharge
 *    et les stocke dans SiteContent.
 *
 * Les clés de fournisseurs IA ne figurent JAMAIS ici en clair côté public :
 * elles sont stockées chiffrées côté serveur et ne sont jamais sérialisées
 * vers le client (voir lib/configurator-settings.ts).
 */

// ── Texte de consentement (modifiable en admin) ──────────────────────────────
export const DEFAULT_CONSENT_TEXT = {
  title: "Avant de commencer : votre consentement",
  body:
    "Pour analyser votre morphologie et générer des concepts adaptés, ce parcours utilise votre caméra ou une photo que vous téléversez. L'analyse du visage s'effectue directement dans votre navigateur — vos images ne quittent pas votre appareil tant que vous ne demandez pas explicitement de générer un portrait. Aucune reconnaissance d'identité n'est effectuée. Les images sont temporaires, supprimables d'un clic à tout moment, et purgées automatiquement.",
  checkbox:
    "J'accepte que mon image soit utilisée, le temps de ce parcours, pour analyser ma morphologie et générer mes concepts de montures. Je peux supprimer ma photo à tout moment.",
  privacyNote:
    "Confidentialité d'abord : consentement obligatoire, aucune reconnaissance d'identité, images temporaires purgées automatiquement, suppression à la demande.",
};

// ── Grille tarifaire (modifiable en admin) ───────────────────────────────────
export type PricingConfig = {
  currency: string;
  base: number; // structure de base imprimée
  materials: { id: string; label: string; note: string; price: number }[];
  finishes: { id: string; label: string; note: string; price: number }[];
  lenses: { id: string; label: string; note: string; price: number }[];
  delivery: { id: string; label: string; note: string; price: number }[];
  urgency: { id: string; label: string; note: string; price: number }[];
  // Coefficients de complexité appliqués à (base + matériau) selon
  // l'imprimabilité du concept (plus c'est complexe à imprimer, plus c'est cher).
  complexity: { low: number; medium: number; high: number };
  marginRate: number; // marge appliquée au sous-total (0.15 = +15 %)
};

export const DEFAULT_PRICING: PricingConfig = {
  currency: "CAD",
  base: 180,
  materials: [
    { id: "pa12-standard", label: "Nylon PA12 — standard", note: "Léger, robuste, mémoire de forme", price: 0 },
    { id: "pa12-premium", label: "Nylon PA12 — premium teinté masse", note: "Teinte profonde, finition supérieure", price: 40 },
    { id: "pa12-carbon", label: "PA12 chargé carbone", note: "Rigidité accrue, aspect technique", price: 90 },
  ],
  finishes: [
    { id: "standard", label: "Satinée standard", note: "Micro-billage uniforme", price: 0 },
    { id: "premium", label: "Premium polie", note: "Lissage et scellement renforcé", price: 45 },
    { id: "signature", label: "Signature main", note: "Finition artisanale, détails contrastés", price: 90 },
  ],
  lenses: [
    { id: "sans-correction", label: "Sans correction", note: "Verres neutres anti-reflets", price: 0 },
    { id: "correction", label: "Correcteurs", note: "Selon votre prescription", price: 120 },
    { id: "solaire", label: "Solaires", note: "Catégorie 3, protection UV", price: 80 },
  ],
  delivery: [
    { id: "standard", label: "Standard", note: "Production à la demande, 2–3 semaines", price: 0 },
    { id: "express", label: "Express", note: "Priorité de production + livraison rapide", price: 35 },
  ],
  urgency: [
    { id: "none", label: "Aucune", note: "Délai habituel", price: 0 },
    { id: "rush", label: "Urgent", note: "Passage prioritaire en file de production", price: 60 },
  ],
  complexity: { low: 1.0, medium: 1.15, high: 1.35 },
  marginRate: 0.0,
};

// ── Fournisseurs IA (statut/config en admin, clés jamais exposées) ───────────
export type ProviderSlot = "image" | "vision";

export const PROVIDER_CATALOG: {
  id: string;
  label: string;
  slot: ProviderSlot;
  models: string[];
  keyEnv: string;
}[] = [
  { id: "openai", label: "OpenAI Images", slot: "image", models: ["gpt-image-1", "dall-e-3"], keyEnv: "OPENAI_API_KEY" },
  { id: "gemini", label: "Google Gemini", slot: "image", models: ["gemini-2.5-flash-image"], keyEnv: "GEMINI_API_KEY" },
  { id: "replicate", label: "Replicate", slot: "image", models: ["black-forest-labs/flux-1.1-pro"], keyEnv: "REPLICATE_API_TOKEN" },
  { id: "stability", label: "Stability AI", slot: "image", models: ["stable-image-core"], keyEnv: "STABILITY_API_KEY" },
  { id: "openai-vision", label: "OpenAI Vision", slot: "vision", models: ["gpt-4o-mini"], keyEnv: "OPENAI_API_KEY" },
];

// Suggestions de modèles par fournisseur (le champ reste libre : on peut
// saisir n'importe quel identifiant, y compris un modèle plus récent).
export const MODEL_CATALOG: Record<string, { id: string; label: string }[]> = {
  openai: [
    { id: "gpt-image-1", label: "GPT Image 1 (édition + transparence)" },
    { id: "gpt-image-1-mini", label: "GPT Image 1 Mini (rapide / économique)" },
    { id: "chatgpt-image-latest", label: "ChatGPT Image — dernière version" },
    { id: "dall-e-3", label: "DALL·E 3" },
  ],
  gemini: [
    { id: "gemini-3-pro-image", label: "Gemini 3 Pro Image — « Nano Banana Pro » (qualité max, édition fidèle)" },
    { id: "gemini-3.1-flash-image", label: "Gemini 3.1 Flash Image — « Nano Banana 2 » (rapide)" },
    { id: "gemini-3-pro-image-preview", label: "Gemini 3 Pro Image (preview)" },
    { id: "gemini-2.5-flash-image", label: "Gemini 2.5 Flash Image — « Nano Banana »" },
    { id: "imagen-4.0-ultra-generate-001", label: "Imagen 4 Ultra (texte→image, sans édition)" },
  ],
  stability: [
    { id: "stable-image-ultra", label: "Stable Image Ultra" },
    { id: "stable-image-core", label: "Stable Image Core" },
    { id: "sd3.5-large", label: "Stable Diffusion 3.5 Large" },
  ],
  replicate: [
    { id: "black-forest-labs/flux-1.1-pro-ultra", label: "FLUX 1.1 Pro Ultra" },
    { id: "black-forest-labs/flux-1.1-pro", label: "FLUX 1.1 Pro" },
    { id: "black-forest-labs/flux-dev", label: "FLUX Dev" },
    { id: "google/nano-banana", label: "Nano Banana (via Replicate)" },
    { id: "recraft-ai/recraft-v3", label: "Recraft V3" },
  ],
};

// Tâches IA du configurateur, avec les fournisseurs réellement capables.
//  - frameOverlay exige une transparence (OpenAI alpha natif, Gemini fond
//    blanc détouré) ;
//  - portrait exige une ÉDITION de la photo (OpenAI /images/edits, Gemini).
export type ImageTask = "moodboard" | "concepts" | "frameOverlay" | "portrait";

export const IMAGE_TASKS: {
  id: ImageTask;
  label: string;
  hint: string;
  providers: string[];
}[] = [
  { id: "moodboard", label: "Moodboard", hint: "Planche d'ambiance éditoriale", providers: ["openai", "gemini", "stability", "replicate"] },
  { id: "concepts", label: "Concepts", hint: "3 montures (Gemini = conditionné sur le moodboard)", providers: ["openai", "gemini", "stability", "replicate"] },
  { id: "frameOverlay", label: "Façade essayage", hint: "PNG transparent pour l'essayage AR", providers: ["openai", "gemini"] },
  { id: "portrait", label: "Portrait porté", hint: "Édite la vraie photo — identité préservée", providers: ["openai", "gemini"] },
];

export type TaskAssignment = { provider: string; model: string };

export type ProvidersConfig = {
  // Affectation fournisseur + modèle par tâche.
  tasks: Record<ImageTask, TaskAssignment>;
  visionProvider: string;
  // Clés (jamais renvoyées au client — masquées en "••••").
  keys: Record<string, string>;
  // Hérités (compat ascendante / repli des tâches non définies).
  imageProvider?: string;
  imageModel?: string;
};

export const DEFAULT_PROVIDERS: ProvidersConfig = {
  tasks: {
    // Portrait + façade par défaut sur OpenAI (édition = identité fiable,
    // transparence native). Moodboard/concepts sur OpenAI également.
    moodboard: { provider: "demo", model: "gpt-image-1" },
    concepts: { provider: "demo", model: "gpt-image-1" },
    frameOverlay: { provider: "demo", model: "gpt-image-1" },
    portrait: { provider: "demo", model: "gpt-image-1" },
  },
  visionProvider: "demo",
  keys: {},
  imageProvider: "demo",
  imageModel: "gpt-image-1",
};

// ── Palettes & matières (pilotent le moodboard et les concepts de démo) ──────
// Associées aux tags de style pour garantir la cohérence visuelle
// moodboard → concepts (même palette, même matière, même langage).
export const STYLE_PALETTES: Record<
  string,
  { name: string; colors: string[]; material: string; texture: string }
> = {
  minimal: { name: "Blanc d'atelier", colors: ["#f3f1ec", "#d8d8d4", "#111111"], material: "PA12 satiné", texture: "lisse mat" },
  sculptural: { name: "Béton sculpté", colors: ["#c9c5bd", "#6f6c66", "#1a1a1a"], material: "PA12 teinté masse", texture: "facettes" },
  technique: { name: "Carbone signal", colors: ["#0f0f10", "#1f6fff", "#d8d8d4"], material: "PA12 carbone", texture: "lattice fin" },
  organique: { name: "Bois & ambre", colors: ["#e7dccb", "#b07a45", "#2b2117"], material: "PA12 premium", texture: "grain doux" },
  "retro-futur": { name: "Néon nocturne", colors: ["#101018", "#ff6a2a", "#4d8cff"], material: "PA12 poli", texture: "contraste mat/poli" },
  discret: { name: "Pierre & fumée", colors: ["#ece9e2", "#9c968c", "#2a2a2a"], material: "PA12 satiné", texture: "mat profond" },
  expressif: { name: "Verre coloré", colors: ["#1a1320", "#ff6a2a", "#1f6fff"], material: "PA12 premium", texture: "facettes vives" },
  matiere: { name: "Minéral chaud", colors: ["#e3ddd1", "#8a7a5f", "#2b2620"], material: "PA12 carbone", texture: "micro-texture" },
};
