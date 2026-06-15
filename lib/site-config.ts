import { getContent } from "@/lib/catalog";

/**
 * Configuration de marque pilotable depuis le back-office (vrai CMS).
 * - `theme`  : palette de couleurs → injectée en variables CSS (globals.css).
 * - `media`  : sources média globales (vidéos, images, modèle 3D) → consommées
 *              par les sections du site. Tout est éditable dans /admin/appearance.
 *
 * Les défauts ci-dessous reflètent la charte actuelle ; toute valeur enregistrée
 * en base (clé SiteContent `theme` / `media`) prend le dessus, champ par champ.
 */

export type SiteTheme = {
  additiveBlue: string;
  electricBlue: string;
  signalOrange: string;
  ink: string;
  paper: string;
};

export type SiteMedia = {
  heroVideo: string;
  heroPoster: string;
  scrollModel: string;
  modulairVideo: string;
  processVideo: string;
};

export const DEFAULT_THEME: SiteTheme = {
  additiveBlue: "#1557ff",
  electricBlue: "#276cff",
  signalOrange: "#ff5a36",
  ink: "#0b0d10",
  paper: "#faf9f5",
};

export const DEFAULT_MEDIA: SiteMedia = {
  heroVideo: "/videos/hero.mp4",
  heroPoster: "/images/editorial/hero-frame.png",
  scrollModel: "/models/hybride.glb",
  modulairVideo: "/videos/modulair-exploded.mp4",
  processVideo: "/videos/print-layers.mp4",
};

/** Métadonnées d'édition (libellés FR + type de champ) pour l'admin. */
export const THEME_FIELDS: { key: keyof SiteTheme; label: string; hint: string }[] = [
  { key: "additiveBlue", label: "Bleu ADDITIVE", hint: "Couleur d'accent principale (boutons, liens, sélection)." },
  { key: "electricBlue", label: "Bleu électrique", hint: "Accent sur les sections sombres." },
  { key: "signalOrange", label: "Orange signal", hint: "Accent secondaire / mises en avant." },
  { key: "ink", label: "Encre (sombre)", hint: "Fond des sections sombres et texte principal." },
  { key: "paper", label: "Papier (clair)", hint: "Fond clair général du site." },
];

export const MEDIA_FIELDS: { key: keyof SiteMedia; label: string; hint: string; accept: string }[] = [
  { key: "heroVideo", label: "Vidéo du hero", hint: "Fond vidéo plein écran de l'accueil (.mp4).", accept: "video" },
  { key: "heroPoster", label: "Image de repli du hero", hint: "Affichée si la vidéo est absente (image).", accept: "image" },
  { key: "scrollModel", label: "Modèle 3D (fil rouge)", hint: "Monture 3D pilotée au scroll (.glb).", accept: "model" },
  { key: "modulairVideo", label: "Vidéo MODUL'AIR", hint: "Démonstration du système modulaire (.mp4).", accept: "video" },
  { key: "processVideo", label: "Vidéo du process", hint: "Fond « impression couche par couche » (.mp4).", accept: "video" },
];

function merge<T extends object>(defaults: T, value: unknown): T {
  if (!value || typeof value !== "object") return { ...defaults };
  const out = { ...defaults } as Record<string, unknown>;
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof v === "string" && v.trim() !== "" && k in out) out[k] = v;
  }
  return out as T;
}

export async function getTheme(): Promise<SiteTheme> {
  return merge(DEFAULT_THEME, await getContent<unknown>("theme"));
}

export async function getMedia(): Promise<SiteMedia> {
  return merge(DEFAULT_MEDIA, await getContent<unknown>("media"));
}

/** N'autorise que des caractères valides pour une couleur CSS (anti-injection). */
function safeColor(v: string, fallback: string): string {
  const cleaned = v.trim();
  return /^[#a-zA-Z0-9(),.%\s-]{1,40}$/.test(cleaned) ? cleaned : fallback;
}

/** Variables CSS à injecter dans :root pour appliquer le thème. */
export function themeToCssVars(theme: SiteTheme): string {
  return [
    `--additive-blue:${safeColor(theme.additiveBlue, DEFAULT_THEME.additiveBlue)}`,
    `--electric-blue:${safeColor(theme.electricBlue, DEFAULT_THEME.electricBlue)}`,
    `--signal-orange:${safeColor(theme.signalOrange, DEFAULT_THEME.signalOrange)}`,
    `--ink:${safeColor(theme.ink, DEFAULT_THEME.ink)}`,
    `--paper:${safeColor(theme.paper, DEFAULT_THEME.paper)}`,
  ].join(";");
}
