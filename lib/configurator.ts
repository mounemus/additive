/**
 * Logique du configurateur "Créer ma monture".
 *
 * Reprend les principes du plugin WordPress "ADDITIVE Créer mes lunettes" :
 *  - parcours canonique par étapes (STEP_ORDER) avec consentement explicite
 *    AVANT tout traitement de données personnelles ;
 *  - diagnostic de style indirect : les réponses sont converties en tags
 *    esthétiques (answersToProfile) — jamais un "diagnostic" de personnalité ;
 *  - génération de 3 CONCEPTS MAXIMUM, triés par score d'imprimabilité
 *    décroissant, via la matrice morphologie × style × audace ;
 *  - la collection réelle (Nexus, Stellar…) sert d'inspiration, JAMAIS de
 *    proposition ;
 *  - l'estimation de prix est TOUJOURS recalculée côté serveur
 *    (app/api/configurator/estimate) ;
 *  - aucun nom de fournisseur d'IA n'apparaît côté client : les futures
 *    intégrations (analyse faciale, moodboard, rendus) passeront par des
 *    routes API internes qui renvoient des messages génériques.
 */

export const STEP_ORDER = [
  "intro",
  "consent",
  "morphology",
  "style",
  "recap",
  "concepts",
  "estimate",
  "request",
] as const;

export type ConfiguratorStep = (typeof STEP_ORDER)[number];

export const STEP_LABELS: Record<ConfiguratorStep, string> = {
  intro: "Bienvenue",
  consent: "Consentement",
  morphology: "Morphologie",
  style: "Style",
  recap: "Votre profil",
  concepts: "Concepts",
  estimate: "Estimation",
  request: "Demande",
};

// ── Morphologie ──────────────────────────────────────────────────────────────

export type FaceShape =
  | "ovale"
  | "rond"
  | "carre"
  | "coeur"
  | "allonge"
  | "anguleux";

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
      "Presque toutes les géométries fonctionnent — l’occasion d’oser une forme expressive.",
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
    id: "allonge",
    label: "Allongé",
    hint: "Visage plus haut que large",
    recommendation:
      "Les verres hauts et les ponts bas raccourcissent visuellement le visage.",
  },
  {
    id: "anguleux",
    label: "Anguleux",
    hint: "Traits nets, pommettes saillantes",
    recommendation:
      "Les géométries paramétriques dialoguent naturellement avec des traits dessinés.",
  },
];

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

/**
 * Questions indirectes : on ne demande jamais "quel est votre style ?",
 * on le déduit de préférences concrètes (principe answers_to_profile du plugin).
 */
export const STYLE_QUESTIONS: StyleQuestion[] = [
  {
    id: "espace",
    question: "Un lieu où vous vous sentez immédiatement bien :",
    options: [
      { id: "galerie", label: "Une galerie d’art contemporain, vide et lumineuse", tags: ["minimal", "discret"] },
      { id: "atelier", label: "Un atelier de fabrication, machines et prototypes", tags: ["technique", "matiere"] },
      { id: "foret", label: "Une forêt dense, lumière filtrée", tags: ["organique", "discret"] },
      { id: "club", label: "Une scène nocturne, néons et architecture brute", tags: ["expressif", "retro-futur"] },
    ],
  },
  {
    id: "objet",
    question: "L’objet que vous garderiez toute une vie :",
    options: [
      { id: "montre", label: "Une montre mécanique au dessin épuré", tags: ["minimal", "matiere"] },
      { id: "sculpture", label: "Une petite sculpture étrange trouvée en voyage", tags: ["sculptural", "expressif"] },
      { id: "outil", label: "Un outil parfaitement conçu, agréable en main", tags: ["technique", "discret"] },
      { id: "vinyle", label: "Un vinyle culte à la pochette iconique", tags: ["retro-futur", "expressif"] },
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
  {
    id: "weekend",
    question: "Votre samedi idéal ressemble à :",
    options: [
      { id: "musee", label: "Une expo, un café, un carnet de notes", tags: ["minimal", "discret"] },
      { id: "ride", label: "Une sortie sport, sensations et dépassement", tags: ["technique", "expressif"] },
      { id: "marche", label: "Un marché, des matières, des rencontres", tags: ["organique", "matiere"] },
      { id: "concert", label: "Un concert, une foule, de l’énergie brute", tags: ["expressif", "retro-futur"] },
    ],
  },
];

export const BOLDNESS_LEVELS = [
  {
    id: "discret",
    label: "Discret",
    description: "Une monture qui accompagne sans jamais dominer.",
  },
  {
    id: "equilibre",
    label: "Équilibré",
    description: "Du caractère, mais portable en toute situation.",
  },
  {
    id: "affirme",
    label: "Affirmé",
    description: "Une pièce statement qui assume sa présence.",
  },
] as const;

export type Boldness = (typeof BOLDNESS_LEVELS)[number]["id"];

/** Convertit les réponses du questionnaire en profil de tags pondérés. */
export function answersToProfile(
  answers: Record<string, string>
): StyleTag[] {
  const score = new Map<StyleTag, number>();
  for (const q of STYLE_QUESTIONS) {
    const picked = q.options.find((o) => o.id === answers[q.id]);
    if (!picked) continue;
    for (const tag of picked.tags) {
      score.set(tag, (score.get(tag) ?? 0) + 1);
    }
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

// ── Génération des concepts (matrice morphologie × style × audace) ──────────

export type Concept = {
  id: string;
  label: string;
  summary: string;
  designNotes: string[];
  printability: number; // score d'imprimabilité 0–100
  basePrice: number;
};

type ConceptTemplate = Omit<Concept, "id"> & {
  tags: StyleTag[];
};

const CONCEPT_LIBRARY: ConceptTemplate[] = [
  {
    label: "Ligne pure",
    summary:
      "Une face fine aux arêtes nettes, épaisseur constante, présence minimale. La précision du SLS au service de la discrétion.",
    designNotes: [
      "Face amincie à épaisseur calibrée",
      "Charnières affleurantes",
      "Texture satinée uniforme",
    ],
    printability: 96,
    basePrice: 250,
    tags: ["minimal", "discret"],
  },
  {
    label: "Structure ouverte",
    summary:
      "Une géométrie ajourée inspirée des structures lattice : matière seulement là où elle travaille, légèreté maximale.",
    designNotes: [
      "Réseau lattice paramétrique sur les branches",
      "Allègement structurel calculé",
      "Impossible à fabriquer autrement qu’en additif",
    ],
    printability: 88,
    basePrice: 290,
    tags: ["technique", "sculptural"],
  },
  {
    label: "Volume sculpté",
    summary:
      "Des volumes pleins et tendus, presque architecturaux, qui jouent avec la lumière. Une pièce de design à porter.",
    designNotes: [
      "Surfaces à double courbure",
      "Jeux d’ombres intégrés au dessin",
      "Équilibrage du poids vers les branches",
    ],
    printability: 90,
    basePrice: 280,
    tags: ["sculptural", "expressif"],
  },
  {
    label: "Trame organique",
    summary:
      "Des courbes continues inspirées de la croissance naturelle, une micro-texture douce au toucher.",
    designNotes: [
      "Courbure générative continue",
      "Micro-texture tactile en surface",
      "Transitions sans arête vive",
    ],
    printability: 93,
    basePrice: 270,
    tags: ["organique", "matiere"],
  },
  {
    label: "Signal rétro-futur",
    summary:
      "Une silhouette qui cite les codes vintage — panto, double pont — et les projette dans la matière additive.",
    designNotes: [
      "Double pont réinterprété",
      "Proportions panto recalculées",
      "Contraste mat / poli",
    ],
    printability: 91,
    basePrice: 275,
    tags: ["retro-futur", "expressif"],
  },
  {
    label: "Instrument technique",
    summary:
      "Le vocabulaire de l’outil de précision : assemblages apparents, ajustements visibles, fonctionnalité assumée.",
    designNotes: [
      "Modules interchangeables (esprit MODUL’AIR)",
      "Visserie et indexations apparentes",
      "Branches à longueur ajustable",
    ],
    printability: 85,
    basePrice: 295,
    tags: ["technique", "expressif"],
  },
  {
    label: "Présence sobre",
    summary:
      "Une monture pleine, mate et profonde, dont la sophistication se révèle dans les détails de finition.",
    designNotes: [
      "Teinte dans la masse",
      "Finition artisanale (esprit HYBRIDE)",
      "Détails visibles uniquement de près",
    ],
    printability: 95,
    basePrice: 265,
    tags: ["discret", "matiere"],
  },
];

const BOLDNESS_PRICE: Record<Boldness, number> = {
  discret: 0,
  equilibre: 10,
  affirme: 25,
};

/**
 * Sélectionne au plus 3 concepts adaptés au profil, triés par score
 * d'imprimabilité décroissant (règle non négociable du plugin).
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
    return { c, affinity };
  })
    .filter((x) => x.affinity > 0)
    .sort((a, b) => b.affinity - a.affinity || b.c.printability - a.c.printability)
    .slice(0, 3)
    // Tri final par imprimabilité décroissante — les meilleurs scores en tête.
    .sort((a, b) => b.c.printability - a.c.printability);

  const picked = scored.length
    ? scored.map((x) => x.c)
    : CONCEPT_LIBRARY.slice(0, 3);

  const morpho = faceShape
    ? FACE_SHAPES.find((f) => f.id === faceShape)
    : null;

  return picked.map((c, i) => ({
    id: `${c.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${i}`,
    label: c.label,
    summary: c.summary,
    designNotes: morpho
      ? [...c.designNotes, `Ajustement morphologique : ${morpho.recommendation}`]
      : c.designNotes,
    printability: c.printability,
    basePrice: c.basePrice + BOLDNESS_PRICE[boldness],
  }));
}

// ── Estimation (recalculée côté serveur) ─────────────────────────────────────

export type EstimateInput = {
  conceptLabel: string;
  boldness: Boldness;
  lensType: "sans-correction" | "correction" | "solaire";
  finish: "standard" | "premium";
};

export const LENS_PRICES: Record<EstimateInput["lensType"], number> = {
  "sans-correction": 0,
  correction: 120,
  solaire: 80,
};

export const FINISH_PRICES: Record<EstimateInput["finish"], number> = {
  standard: 0,
  premium: 45,
};

/**
 * Recalcule l'estimation à partir des entrées brutes. À n'utiliser QUE côté
 * serveur (route /api/configurator/estimate) — le client n'affiche jamais un
 * prix qu'il a calculé lui-même. Aucun frais "génération IA" n'est facturé.
 */
export function computeEstimate(input: EstimateInput): {
  base: number;
  lens: number;
  finish: number;
  total: number;
  currency: "CAD";
} {
  const template = CONCEPT_LIBRARY.find((c) => c.label === input.conceptLabel);
  const base = (template?.basePrice ?? 250) + BOLDNESS_PRICE[input.boldness];
  const lens = LENS_PRICES[input.lensType];
  const finish = FINISH_PRICES[input.finish];
  return { base, lens, finish, total: base + lens + finish, currency: "CAD" };
}
