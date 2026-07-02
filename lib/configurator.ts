/**
 * Logique du configurateur "Créer ma monture".
 *
 * Portage des principes du plugin WordPress "ADDITIVE Créer mes lunettes" :
 *  - parcours canonique par étapes (STEP_ORDER) avec CONSENTEMENT explicite
 *    avant toute capture/analyse d'image ;
 *  - analyse faciale en direct (MediaPipe, côté navigateur) → forme du visage
 *    + mesures millimétriques calibrées sur l'iris ;
 *  - diagnostic de style indirect : réponses converties en tags esthétiques
 *    (answersToProfile) — jamais un test de personnalité ;
 *  - moodboard éditorial puis 3 CONCEPTS MAXIMUM, COHÉRENTS avec le moodboard
 *    (même palette/matière), adaptés à la morphologie, avec score
 *    d'imprimabilité ET taux de correspondance, les meilleurs en tête ;
 *  - la collection réelle (Nexus, Stellar…) inspire, n'est JAMAIS une
 *    proposition ;
 *  - le prix est TOUJOURS recalculé côté serveur (/api/configurator/quote) ;
 *  - aucun nom de fournisseur d'IA n'apparaît côté client.
 */

import { STYLE_PALETTES, type PricingConfig } from "@/content/configurator-defaults";

export const STEP_ORDER = [
  "intro",
  "consent",
  "capture",
  "analysis",
  "style",
  "moodboard",
  "concepts",
  "tryon",
  "quote",
  "request",
] as const;

export type ConfiguratorStep = (typeof STEP_ORDER)[number];

export const STEP_LABELS: Record<ConfiguratorStep, string> = {
  intro: "Bienvenue",
  consent: "Consentement",
  capture: "Capture",
  analysis: "Analyse faciale",
  style: "Style",
  moodboard: "Moodboard",
  concepts: "Concepts",
  tryon: "Essayage",
  quote: "Prix",
  request: "Finaliser",
};

// ── Morphologie ──────────────────────────────────────────────────────────────

export type FaceShape =
  | "ovale"
  | "rond"
  | "carre"
  | "coeur"
  | "diamant"
  | "allonge";

export const FACE_SHAPES: {
  id: FaceShape;
  label: string;
  hint: string;
  recommendation: string;
}[] = [
  {
    id: "ovale",
    label: "Ovale",
    hint: "Proportions équilibrées, pommettes légèrement plus larges",
    recommendation:
      "Presque toutes les géométries fonctionnent — l'occasion d'oser une forme expressive.",
  },
  {
    id: "rond",
    label: "Rond",
    hint: "Largeur et hauteur proches, lignes douces",
    recommendation:
      "Les faces anguleuses et rectangulaires structurent et allongent le visage.",
  },
  {
    id: "carre",
    label: "Carré",
    hint: "Mâchoire marquée, front large",
    recommendation:
      "Les courbes — panto, formes rondes ou ovales — adoucissent les angles.",
  },
  {
    id: "coeur",
    label: "Cœur",
    hint: "Front large, menton fin",
    recommendation:
      "Les faces fines, légères en partie basse, rééquilibrent les proportions.",
  },
  {
    id: "diamant",
    label: "Diamant",
    hint: "Pommettes saillantes, front et menton plus étroits",
    recommendation:
      "Les faces ovales ou à ligne de sourcil marquée mettent en valeur les pommettes.",
  },
  {
    id: "allonge",
    label: "Allongé",
    hint: "Visage plus haut que large",
    recommendation:
      "Les verres hauts et les ponts bas raccourcissent visuellement le visage.",
  },
];

/** Règles de chausse par morphologie (alimentent le rapport d'analyse). */
export const MORPHOLOGY_RULES: Record<
  FaceShape,
  { advise: string[]; avoid: string[] }
> = {
  ovale: {
    advise: ["Formes affirmées", "Géométries sculpturales", "Proportions généreuses"],
    avoid: ["Montures trop grandes qui déséquilibrent l'harmonie"],
  },
  rond: {
    advise: ["Faces rectangulaires", "Angles marqués", "Branches hautes"],
    avoid: ["Formes rondes qui accentuent la rondeur"],
  },
  carre: {
    advise: ["Courbes douces", "Panto, ovales", "Bords arrondis"],
    avoid: ["Angles vifs qui durcissent les traits"],
  },
  coeur: {
    advise: ["Faces fines", "Bas léger / sans cerclage bas", "Ponts bas"],
    avoid: ["Hauts massifs qui alourdissent le front"],
  },
  diamant: {
    advise: ["Ligne de sourcil marquée", "Faces ovales", "Largeur maîtrisée"],
    avoid: ["Faces étroites qui amincissent encore le front"],
  },
  allonge: {
    advise: ["Verres hauts", "Faces enveloppantes", "Ponts bas"],
    avoid: ["Montures fines et basses qui allongent le visage"],
  },
};

// ── Diagnostic de style (questionnaire indirect) ────────────────────────────

export type StyleTag =
  | "minimal"
  | "sculptural"
  | "technique"
  | "organique"
  | "retro-futur"
  | "discret"
  | "expressif"
  | "matiere";

export type StyleQuestion = {
  id: string;
  question: string;
  options: { id: string; label: string; tags: StyleTag[] }[];
};

export const STYLE_QUESTIONS: StyleQuestion[] = [
  {
    id: "espace",
    question: "Un lieu où vous vous sentez immédiatement bien :",
    options: [
      { id: "galerie", label: "Une galerie d'art contemporain, vide et lumineuse", tags: ["minimal", "discret"] },
      { id: "atelier", label: "Un atelier de fabrication, machines et prototypes", tags: ["technique", "matiere"] },
      { id: "foret", label: "Une forêt dense, lumière filtrée", tags: ["organique", "discret"] },
      { id: "club", label: "Une scène nocturne, néons et architecture brute", tags: ["expressif", "retro-futur"] },
    ],
  },
  {
    id: "objet",
    question: "L'objet que vous garderiez toute une vie :",
    options: [
      { id: "montre", label: "Une montre mécanique au dessin épuré", tags: ["minimal", "matiere"] },
      { id: "sculpture", label: "Une petite sculpture étrange trouvée en voyage", tags: ["sculptural", "expressif"] },
      { id: "outil", label: "Un outil parfaitement conçu, agréable en main", tags: ["technique", "discret"] },
      { id: "vinyle", label: "Un vinyle culte à la pochette iconique", tags: ["retro-futur", "expressif"] },
    ],
  },
  {
    id: "couleur",
    question: "La couleur qui revient dans votre quotidien :",
    options: [
      { id: "neutre", label: "Des neutres — noir, écru, gris pierre", tags: ["minimal", "discret"] },
      { id: "terre", label: "Des tons terreux — ocre, brun, vert profond", tags: ["organique", "matiere"] },
      { id: "vif", label: "Une couleur franche qui claque — orange, bleu", tags: ["expressif", "retro-futur"] },
      { id: "metal", label: "Des gris techniques — graphite, acier", tags: ["technique", "sculptural"] },
    ],
  },
  {
    id: "matiere",
    question: "La matière qui vous attire le plus :",
    options: [
      { id: "beton", label: "Béton brut, surfaces minérales", tags: ["sculptural", "minimal"] },
      { id: "carbone", label: "Fibre de carbone, alliages techniques", tags: ["technique", "retro-futur"] },
      { id: "bois", label: "Bois poncé, matières chaudes", tags: ["organique", "matiere"] },
      { id: "verre", label: "Verre coloré, reflets changeants", tags: ["expressif", "sculptural"] },
    ],
  },
];

export const BOLDNESS_LEVELS = [
  { id: "discret", label: "Discret", description: "Une monture qui accompagne sans jamais dominer." },
  { id: "equilibre", label: "Équilibré", description: "Du caractère, mais portable en toute situation." },
  { id: "affirme", label: "Affirmé", description: "Une pièce statement qui assume sa présence." },
] as const;

export type Boldness = (typeof BOLDNESS_LEVELS)[number]["id"];

/** Convertit les réponses du questionnaire en profil de tags pondérés. */
export function answersToProfile(answers: Record<string, string>): StyleTag[] {
  const score = new Map<StyleTag, number>();
  for (const q of STYLE_QUESTIONS) {
    const picked = q.options.find((o) => o.id === answers[q.id]);
    if (!picked) continue;
    for (const tag of picked.tags) score.set(tag, (score.get(tag) ?? 0) + 1);
  }
  return [...score.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag]) => tag);
}

export const TAG_LABELS: Record<StyleTag, string> = {
  minimal: "Minimal",
  sculptural: "Sculptural",
  technique: "Technique",
  organique: "Organique",
  "retro-futur": "Rétro-futur",
  discret: "Discret",
  expressif: "Expressif",
  matiere: "Matière",
};

/** Palette dominante d'un profil (cohérence moodboard ↔ concepts). */
export function profilePalette(styleTags: StyleTag[]) {
  const primary = styleTags[0] ?? "minimal";
  return STYLE_PALETTES[primary] ?? STYLE_PALETTES.minimal;
}

// ── Génération des concepts (matrice morphologie × style × audace) ──────────

export type Concept = {
  id: string;
  label: string;
  summary: string;
  designNotes: string[];
  printability: number; // score d'imprimabilité 0–100
  matchRate: number; // taux de correspondance au profil 0–100
  basePrice: number;
  complexity: "low" | "medium" | "high";
  tags: StyleTag[];
};

type ConceptTemplate = Omit<Concept, "id" | "matchRate"> & { tags: StyleTag[] };

const CONCEPT_LIBRARY: ConceptTemplate[] = [
  {
    label: "Ligne pure",
    summary: "Une face fine aux arêtes nettes, épaisseur constante, présence minimale. La précision du SLS au service de la discrétion.",
    designNotes: ["Face amincie à épaisseur calibrée", "Charnières affleurantes", "Texture satinée uniforme"],
    printability: 96,
    basePrice: 250,
    complexity: "low",
    tags: ["minimal", "discret"],
  },
  {
    label: "Structure ouverte",
    summary: "Une géométrie ajourée inspirée des structures lattice : matière seulement là où elle travaille, légèreté maximale.",
    designNotes: ["Réseau lattice paramétrique sur les branches", "Allègement structurel calculé", "Impossible à fabriquer autrement qu'en additif"],
    printability: 88,
    basePrice: 290,
    complexity: "high",
    tags: ["technique", "sculptural"],
  },
  {
    label: "Volume sculpté",
    summary: "Des volumes pleins et tendus, presque architecturaux, qui jouent avec la lumière. Une pièce de design à porter.",
    designNotes: ["Surfaces à double courbure", "Jeux d'ombres intégrés au dessin", "Équilibrage du poids vers les branches"],
    printability: 90,
    basePrice: 280,
    complexity: "medium",
    tags: ["sculptural", "expressif"],
  },
  {
    label: "Trame organique",
    summary: "Des courbes continues inspirées de la croissance naturelle, une micro-texture douce au toucher.",
    designNotes: ["Courbure générative continue", "Micro-texture tactile en surface", "Transitions sans arête vive"],
    printability: 93,
    basePrice: 270,
    complexity: "medium",
    tags: ["organique", "matiere"],
  },
  {
    label: "Signal rétro-futur",
    summary: "Une silhouette qui cite les codes vintage — panto, double pont — et les projette dans la matière additive.",
    designNotes: ["Double pont réinterprété", "Proportions panto recalculées", "Contraste mat / poli"],
    printability: 91,
    basePrice: 275,
    complexity: "medium",
    tags: ["retro-futur", "expressif"],
  },
  {
    label: "Instrument technique",
    summary: "Le vocabulaire de l'outil de précision : assemblages apparents, ajustements visibles, fonctionnalité assumée.",
    designNotes: ["Modules interchangeables (esprit MODUL'AIR)", "Visserie et indexations apparentes", "Branches à longueur ajustable"],
    printability: 85,
    basePrice: 295,
    complexity: "high",
    tags: ["technique", "expressif"],
  },
  {
    label: "Présence sobre",
    summary: "Une monture pleine, mate et profonde, dont la sophistication se révèle dans les détails de finition.",
    designNotes: ["Teinte dans la masse", "Finition artisanale (esprit HYBRIDE)", "Détails visibles uniquement de près"],
    printability: 95,
    basePrice: 265,
    complexity: "low",
    tags: ["discret", "matiere"],
  },
];

const BOLDNESS_PRICE: Record<Boldness, number> = { discret: 0, equilibre: 10, affirme: 25 };

/**
 * Sélectionne au plus 3 concepts adaptés au profil, avec score
 * d'imprimabilité ET taux de correspondance, les meilleurs en tête.
 */
export function buildConcepts(
  faceShape: FaceShape | null,
  styleTags: StyleTag[],
  boldness: Boldness
): Concept[] {
  const scored = CONCEPT_LIBRARY.map((c) => {
    let affinity = 0;
    for (const t of c.tags) if (styleTags.includes(t)) affinity += 2;
    if (boldness === "affirme" && c.tags.includes("expressif")) affinity += 1;
    if (boldness === "discret" && c.tags.includes("discret")) affinity += 1;
    // Taux de correspondance : affinité normalisée + part d'imprimabilité.
    const matchRate = Math.min(
      99,
      Math.round(48 + affinity * 9 + (c.printability - 85) * 0.6)
    );
    return { c, affinity, matchRate };
  })
    .filter((x) => x.affinity > 0)
    .sort(
      (a, b) =>
        b.matchRate - a.matchRate || b.c.printability - a.c.printability
    )
    .slice(0, 3);

  const picked = scored.length
    ? scored
    : CONCEPT_LIBRARY.slice(0, 3).map((c) => ({ c, affinity: 0, matchRate: 70 }));

  const morpho = faceShape ? FACE_SHAPES.find((f) => f.id === faceShape) : null;

  return picked
    .map(({ c, matchRate }, i) => ({
      id: `${c.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${i}`,
      label: c.label,
      summary: c.summary,
      designNotes: morpho
        ? [...c.designNotes, `Ajustement morphologique : ${morpho.recommendation}`]
        : c.designNotes,
      printability: c.printability,
      matchRate,
      basePrice: c.basePrice + BOLDNESS_PRICE[boldness],
      complexity: c.complexity,
      tags: c.tags,
    }))
    // Affichage : meilleurs taux de correspondance en tête.
    .sort((a, b) => b.matchRate - a.matchRate);
}

export function conceptByLabel(label: string): ConceptTemplate | undefined {
  return CONCEPT_LIBRARY.find((c) => c.label === label);
}

// ── Prompts IA en français (moodboard + concepts), anonymisés ───────────────

/**
 * Prompt FR riche pour le MOODBOARD éditorial : matières, palette, textures
 * lattice, silhouettes — façon magazine de design.
 */
export function buildMoodboardPromptFr(
  styleTags: StyleTag[],
  faceShape: FaceShape | null
): string {
  const pal = profilePalette(styleTags);
  const tags = styleTags.map((t) => TAG_LABELS[t]).join(", ");
  const morpho = faceShape ? FACE_SHAPES.find((f) => f.id === faceShape)?.label : null;
  return [
    "Planche d'ambiance éditoriale haut de gamme façon magazine de design (Dezeen, Kinfolk),",
    "grille de 12 à 14 vignettes, lumière naturelle douce, fond clair.",
    `Direction esthétique : ${tags}.`,
    `Palette imposée : ${pal.colors.join(", ")} (${pal.name}).`,
    `Matière dominante : ${pal.material}, texture ${pal.texture}, structures lattice imprimées en 3D.`,
    "Inclure : échantillons de nylon PA12, gros plans de textures, détails de charnières,",
    "silhouettes de montures de lunettes, références de couleurs et de matières.",
    morpho ? `Sensibilité adaptée à un visage ${morpho}.` : "",
    "Aucun texte, aucun logo, aucun visage humain reconnaissable.",
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Prompt FR pour un CONCEPT de monture, conditionné sur le moodboard
 * (même palette, même matière, même langage de design) et la morphologie.
 */
export function buildConceptPromptFr(
  concept: Concept,
  styleTags: StyleTag[],
  faceShape: FaceShape | null
): string {
  const pal = profilePalette(styleTags);
  const morpho = faceShape ? FACE_SHAPES.find((f) => f.id === faceShape) : null;
  return [
    `Rendu produit réaliste d'une monture de lunettes imprimée en 3D, concept « ${concept.label} ».`,
    concept.summary,
    `Détails de design : ${concept.designNotes.join("; ")}.`,
    `Matière : ${pal.material}, finition ${pal.texture}.`,
    `Palette cohérente avec le moodboard : ${pal.colors.join(", ")}.`,
    morpho ? `Proportions adaptées à un visage ${morpho.label}.` : "",
    "Vue trois-quarts sur fond studio neutre, éclairage doux, ombres maîtrisées,",
    "matière nylon PA12 visible, aucune marque, aucun texte, aucun visage.",
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Prompt FR pour le PORTRAIT PORTÉ : la personne portant exactement la
 * monture choisie, identité STRICTEMENT préservée.
 */
export function buildWornPortraitPromptFr(
  concept: Concept,
  styleTags: StyleTag[],
  hasConceptImage = false
): string {
  const pal = profilePalette(styleTags);
  return [
    "À partir de la PREMIÈRE image (photo de la personne) : garde STRICTEMENT",
    "identiques son visage, son identité, ses traits, sa carnation, sa coiffure,",
    "sa barbe, son expression et l'arrière-plan. Ne change RIEN du visage.",
    hasConceptImage
      ? "La DEUXIÈME image montre la monture exacte à lui faire porter : reproduis-en fidèlement la forme, l'épaisseur et la couleur."
      : `Ajoute la monture « ${concept.label} » : ${concept.summary}`,
    `Matière ${pal.material}, teinte cohérente (${pal.colors.join(", ")}).`,
    "Place la monture naturellement sur le nez et les oreilles, perspective et",
    "échelle correctes, lumière et grain raccordés à la photo d'origine.",
    "Résultat photoréaliste, la même personne portant ces lunettes.",
  ].join(" ");
}

/**
 * Prompt façade transparente pour l'essayage AR : la FACE seule de la monture,
 * branches coupées aux charnières, cadrage bord à bord (l'overlay est ensuite
 * rogné sur l'alpha et ancré aux landmarks).
 */
export function buildFrameOverlayPromptFr(concept: Concept, styleTags: StyleTag[]): string {
  const pal = profilePalette(styleTags);
  return [
    "Vue strictement de face de la SEULE façade d'une monture de lunettes",
    `imprimée en 3D « ${concept.label} » (branches coupées net aux charnières,`,
    "ne montrer que la face avant avec les deux cercles et le pont).",
    concept.summary,
    `Matière ${pal.material}, couleur ${pal.colors[1] ?? pal.colors[0]}.`,
    "Cadrage bord à bord, monture centrée et horizontale, occupant toute la largeur,",
    "verres transparents (pas de reflet opaque), aucune ombre portée, aucun visage.",
  ].join(" ");
}

// ── Estimation / devis (recalculé côté serveur) ─────────────────────────────

export type QuoteInput = {
  conceptLabel?: string;
  boldness: Boldness;
  material: string;
  finish: string;
  lensType: string;
  delivery: string;
  urgency: string;
};

/**
 * Options par défaut du devis (celles présélectionnées à l'écran Prix).
 * Partagées entre le client (état initial) et le serveur (prix « À partir de »
 * des cartes concept) pour que carte et devis au premier choix soient IDENTIQUES.
 */
export const DEFAULT_QUOTE_OPTIONS = {
  material: "pa12-standard",
  finish: "standard",
  lensType: "sans-correction",
  delivery: "standard",
  urgency: "none",
} as const;

export type QuoteBreakdown = {
  base: number;
  material: number;
  finish: number;
  lens: number;
  delivery: number;
  urgency: number;
  complexityCoef: number;
  margin: number;
  total: number;
  currency: string;
};

function priceOf(list: { id: string; price: number }[], id: string): number {
  return list.find((x) => x.id === id)?.price ?? 0;
}

/**
 * Recalcule le devis à partir des entrées brutes et de la grille admin.
 * À n'utiliser QUE côté serveur — le client n'affiche jamais un prix
 * qu'il a calculé lui-même. Aucun frais « génération IA ».
 *
 * COHÉRENCE CARTE ↔ DEVIS : la base est le prix du CONCEPT choisi
 * (CONCEPT_LIBRARY, celui affiché « À partir de » sur la carte), pas la base
 * générique de la grille — celle-ci ne sert que de repli sans concept connu.
 * La complexité du concept étant déjà tarifée dans son prix de base, le
 * coefficient ne s'applique qu'au SURCOÛT matériau. Ainsi, au premier choix
 * (options par défaut toutes incluses), total devis = prix affiché sur la carte.
 */
export function computeQuote(input: QuoteInput, pricing: PricingConfig): QuoteBreakdown {
  const tpl = input.conceptLabel ? conceptByLabel(input.conceptLabel) : undefined;
  const complexity = tpl?.complexity ?? "medium";
  const complexityCoef = pricing.complexity[complexity] ?? 1;

  const conceptBase = tpl?.basePrice ?? pricing.base;
  const base = conceptBase + BOLDNESS_PRICE[input.boldness ?? "equilibre"];
  // Surcoût matériau pondéré par la complexité d'impression du concept.
  const material = Math.round(priceOf(pricing.materials, input.material) * complexityCoef);
  const finish = priceOf(pricing.finishes, input.finish);
  const lens = priceOf(pricing.lenses, input.lensType);
  const delivery = priceOf(pricing.delivery, input.delivery);
  const urgency = priceOf(pricing.urgency, input.urgency);

  const subtotal = base + material + finish + lens + delivery + urgency;
  const margin = Math.round(subtotal * (pricing.marginRate ?? 0));
  const total = subtotal + margin;

  return {
    base,
    material,
    finish,
    lens,
    delivery,
    urgency,
    complexityCoef,
    margin,
    total,
    currency: pricing.currency,
  };
}
