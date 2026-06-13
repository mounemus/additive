/**
 * Système modulaire MODUL'AIR — « Moduler mes lunettes ».
 *
 * La lunette n'est plus un produit fixe mais un assemblage configurable de
 * composants interchangeables imprimés en 3D :
 *   Face avant × Branches × Couleur de face × Couleur de branches × Verres × Finition
 *
 * Ce module fournit le catalogue d'options, le calcul de prix (confirmé
 * serveur) et la synthèse d'un prompt IA décrivant la combinaison exacte —
 * réutilisée par le rendu studio, l'essayage AR et le portrait porté.
 */

export type ModColor = { id: string; label: string; hex: string };

export const MOD_COLORS: ModColor[] = [
  { id: "black", label: "Black", hex: "#111111" },
  { id: "white", label: "White", hex: "#f4f1ea" },
  { id: "blue", label: "Blue", hex: "#1f6fff" },
  { id: "red", label: "Red", hex: "#e23b2e" },
  { id: "orange", label: "Orange", hex: "#ff6a2a" },
];

export const FACE_SHAPES_MOD = [
  { id: "ronde", label: "Ronde / Panto", hint: "Cercles ronds, esprit rétro doux" },
  { id: "ovale", label: "Ovale", hint: "Équilibrée, intemporelle" },
  { id: "carree", label: "Carrée", hint: "Angles marqués, caractère" },
  { id: "rectangulaire", label: "Rectangulaire", hint: "Lignes horizontales nettes" },
  { id: "geometrique", label: "Géométrique", hint: "Facettes et arêtes franches" },
  { id: "papillon", label: "Papillon", hint: "Remontée expressive aux tempes" },
  { id: "organique", label: "Organique", hint: "Courbes continues, fluides" },
  { id: "sculpturale", label: "Sculpturale / Générative", hint: "Volume statement, paramétrique" },
] as const;

export type FaceShapeMod = (typeof FACE_SHAPES_MOD)[number]["id"];

export const BRANCH_STYLES = [
  { id: "minimaliste", label: "Minimaliste", hint: "Fines, discrètes", price: 0 },
  { id: "sportive", label: "Sportive", hint: "Maintien renforcé", price: 10 },
  { id: "architecturale", label: "Architecturale", hint: "Structure géométrique", price: 20 },
  { id: "organique", label: "Organique", hint: "Courbes naturelles", price: 15 },
  { id: "expressive", label: "Expressive / Sculpturale", hint: "Pièce de caractère", price: 25 },
] as const;

export type BranchStyle = (typeof BRANCH_STYLES)[number]["id"];

export const VERRES = [
  { id: "transparent", label: "Transparents", hint: "Sans correction, anti-reflets", price: 0 },
  { id: "correcteurs", label: "Correcteurs", hint: "Selon prescription", price: 120 },
  { id: "solaire-teinte", label: "Solaires teintés", hint: "Catégorie 3, UV", price: 80 },
  { id: "degrade", label: "Solaires dégradés", hint: "Dégradé haut→bas", price: 95 },
  { id: "reflechissant", label: "Réfléchissants", hint: "Effet miroir", price: 110 },
] as const;

export type VerreType = (typeof VERRES)[number]["id"];

export const FINISHES_MOD = [
  { id: "mat", label: "Mat naturel PA12", hint: "Brut, authentique", price: 0 },
  { id: "lisse", label: "Surface lisse", hint: "Toucher doux", price: 10 },
  { id: "microstructure", label: "Microstructurée", hint: "Grain technique", price: 20 },
  { id: "lattice", label: "Lattice localisé", hint: "Motif ajouré paramétrique", price: 35 },
  { id: "satine", label: "Satinée", hint: "Reflet doux", price: 25 },
  { id: "brillant", label: "Brillante", hint: "Polie, lumineuse", price: 30 },
] as const;

export type FinishMod = (typeof FINISHES_MOD)[number]["id"];

export type ModulairSelection = {
  faceShape: FaceShapeMod;
  faceColor: string;
  branchStyle: BranchStyle;
  branchColor: string;
  verre: VerreType;
  finish: FinishMod;
};

export const DEFAULT_SELECTION: ModulairSelection = {
  faceShape: "ronde",
  faceColor: "black",
  branchStyle: "minimaliste",
  branchColor: "black",
  verre: "transparent",
  finish: "mat",
};

const MOD_BASE = 220; // structure de base imprimée

// ── Configuration administrable des éléments de combinaison ─────────────────
export type ModOption = { id: string; label: string; hint: string; price: number };

export type ModulairConfig = {
  base: number;
  bicolor: number; // surcoût assemblage bicolore
  currency: string;
  colors: ModColor[];
  branchStyles: ModOption[];
  verres: ModOption[];
  finishes: ModOption[];
};

export const MODULAIR_DEFAULT_CONFIG: ModulairConfig = {
  base: MOD_BASE,
  bicolor: 15,
  currency: "CAD",
  colors: MOD_COLORS,
  branchStyles: BRANCH_STYLES.map((b) => ({ id: b.id, label: b.label, hint: b.hint, price: b.price })),
  verres: VERRES.map((v) => ({ id: v.id, label: v.label, hint: v.hint, price: v.price })),
  finishes: FINISHES_MOD.map((f) => ({ id: f.id, label: f.label, hint: f.hint, price: f.price })),
};

function price(list: { id: string; price: number }[], id: string): number {
  return list.find((x) => x.id === id)?.price ?? 0;
}

export function colorOf(id: string, colors: ModColor[] = MOD_COLORS): ModColor {
  return colors.find((c) => c.id === id) ?? MOD_COLORS[0];
}

/** Prix calculé à partir de la config admin (le serveur reste l'autorité). */
export function computeModulairPrice(
  sel: ModulairSelection,
  cfg: ModulairConfig = MODULAIR_DEFAULT_CONFIG
): {
  base: number;
  branches: number;
  verres: number;
  finish: number;
  bicolor: number;
  total: number;
  currency: string;
} {
  const branches = price(cfg.branchStyles, sel.branchStyle);
  const verres = price(cfg.verres, sel.verre);
  const finish = price(cfg.finishes, sel.finish);
  const bicolor = sel.faceColor !== sel.branchColor ? cfg.bicolor : 0;
  const total = cfg.base + branches + verres + finish + bicolor;
  return { base: cfg.base, branches, verres, finish, bicolor, total, currency: cfg.currency };
}

export function selectionSummaryFr(sel: ModulairSelection): string {
  const face = FACE_SHAPES_MOD.find((f) => f.id === sel.faceShape)?.label ?? sel.faceShape;
  const branch = BRANCH_STYLES.find((b) => b.id === sel.branchStyle)?.label ?? sel.branchStyle;
  const verre = VERRES.find((v) => v.id === sel.verre)?.label ?? sel.verre;
  const finish = FINISHES_MOD.find((f) => f.id === sel.finish)?.label ?? sel.finish;
  const fc = colorOf(sel.faceColor).label;
  const bc = colorOf(sel.branchColor).label;
  return `Face ${face} ${fc} · branches ${branch} ${bc} · verres ${verre} · finition ${finish}`;
}

/** Prompt FR riche décrivant la combinaison pour le rendu studio IA. */
export function buildModulairPromptFr(sel: ModulairSelection): string {
  const face = FACE_SHAPES_MOD.find((f) => f.id === sel.faceShape);
  const branch = BRANCH_STYLES.find((b) => b.id === sel.branchStyle);
  const verre = VERRES.find((v) => v.id === sel.verre);
  const finish = FINISHES_MOD.find((f) => f.id === sel.finish);
  const fc = colorOf(sel.faceColor);
  const bc = colorOf(sel.branchColor);
  return [
    "Rendu produit photoréaliste d'une monture de lunettes imprimée en 3D, système modulaire.",
    `Face avant de forme ${face?.label} (${face?.hint}), couleur ${fc.label} (${fc.hex}).`,
    `Branches ${branch?.label} (${branch?.hint}), couleur ${bc.label} (${bc.hex}).`,
    `Verres ${verre?.label}. Finition ${finish?.label} en nylon PA12.`,
    sel.faceColor !== sel.branchColor ? "Assemblage bicolore assumé (face et branches contrastées)." : "Monture monochrome.",
    "Vue trois-quarts sur fond studio neutre clair, éclairage doux, ombres maîtrisées,",
    "matière nylon PA12 visible, aucune marque, aucun texte, aucun visage.",
  ].join(" ");
}

export const VERRE_TINT: Record<VerreType, string> = {
  transparent: "rgba(180,200,220,0.18)",
  correcteurs: "rgba(180,200,220,0.12)",
  "solaire-teinte": "rgba(40,40,40,0.55)",
  degrade: "rgba(40,40,40,0.4)",
  reflechissant: "rgba(120,170,255,0.45)",
};
