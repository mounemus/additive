/**
 * Architecture multilingue FR/EN.
 *
 * Le français est la langue principale (routes racine, SEO historique
 * préservé) ; l'anglais vit sous /en en vraies routes statiques additives.
 * Les chaînes de chrome (nav, footer, CTA, sections partagées) sont
 * centralisées ici ; les noms propres de collections (MODUL'AIR, GENERATIVE,
 * HYBRIDE) et les descriptions produit (déjà rédigées en anglais côté DB)
 * ne se traduisent pas.
 */

export type Locale = "fr" | "en";
export const LOCALES: Locale[] = ["fr", "en"];
export const DEFAULT_LOCALE: Locale = "fr";

type Dict = Record<string, { fr: string; en: string }>;

export const strings = {
  "nav.collections": { fr: "Collections", en: "Collections" },
  "nav.models": { fr: "Modèles", en: "Models" },
  "nav.customize": { fr: "Personnalisation", en: "Customize" },
  "nav.lookbook": { fr: "Lookbook", en: "Lookbook" },
  "nav.technology": { fr: "Technologie", en: "Technology" },
  "nav.manifesto": { fr: "Manifeste", en: "Manifesto" },
  "nav.about": { fr: "À propos", en: "About" },
  "nav.faq": { fr: "FAQ", en: "FAQ" },
  "nav.contact": { fr: "Contact", en: "Contact" },
  "nav.aria.main": { fr: "Navigation principale", en: "Main navigation" },
  "nav.aria.mobile": { fr: "Navigation mobile", en: "Mobile navigation" },
  "nav.aria.search": { fr: "Rechercher des modèles", en: "Browse the models" },
  "nav.aria.account": { fr: "Compte", en: "Account" },
  "nav.aria.cart": { fr: "Panier", en: "Cart" },
  "nav.aria.openMenu": { fr: "Ouvrir le menu", en: "Open menu" },
  "nav.aria.closeMenu": { fr: "Fermer le menu", en: "Close menu" },
  "cta.create": { fr: "Créer mes lunettes", en: "Create my glasses" },
  "cta.createFrame": { fr: "Créer ma monture", en: "Create my frame" },
  "cta.explore": { fr: "Explorer les collections", en: "Explore the collections" },
  "tagline": {
    fr: "Pas conçues pour tout le monde. Conçues pour vous.",
    en: "Not made for everyone. Made for you.",
  },
  "tagline.line1": { fr: "Pas conçues pour tout le monde.", en: "Not made for everyone." },
  "tagline.line2": { fr: "Conçues pour vous.", en: "Made for you." },
  "skipLink": { fr: "Aller au contenu", en: "Skip to content" },
  "eyebrow.technology": { fr: "Technologie", en: "Technology" },
  "footer.brandBlurb": {
    fr: "Lunetterie modulaire imprimée en 3D. Design paramétrique, nylon PA12, personnalisation morphologique — conçue et fabriquée à la demande à Montréal.",
    en: "Modular 3D-printed eyewear. Parametric design, PA12 nylon, morphological fit — designed and made on demand in Montréal.",
  },
  "footer.location": { fr: "Montréal · Québec · Canada", en: "Montréal · Québec · Canada" },
  "footer.newsletter.title": { fr: "Restez informé·e", en: "Stay in the loop" },
  "footer.newsletter.note": {
    fr: "Nouvelles collections, modules et coulisses d’atelier. Pas de spam.",
    en: "New collections, modules and workshop stories. No spam.",
  },
  "footer.newsletter.placeholder": { fr: "Votre email", en: "Your email" },
  "footer.newsletter.cta": { fr: "S’inscrire", en: "Subscribe" },
  "footer.newsletter.aria.email": { fr: "Email pour l’infolettre", en: "Email for the newsletter" },
  "footer.newsletter.aria.submit": { fr: "S’inscrire à l’infolettre", en: "Subscribe to the newsletter" },
  "footer.newsletter.done": { fr: "Merci — vous êtes inscrit·e.", en: "Thank you — you’re on the list." },
  "footer.rights": { fr: "Tous droits réservés.", en: "All rights reserved." },
  "footer.shipping": { fr: "Livraison & retours", en: "Shipping & returns" },
  "footer.privacy": { fr: "Confidentialité", en: "Privacy" },
  "footer.col.explore": { fr: "Explorer", en: "Explore" },
  "footer.col.brand": { fr: "La marque", en: "The brand" },
  "footer.col.services": { fr: "Services", en: "Services" },
  "footer.link.allModels": { fr: "Tous les modèles", en: "All the models" },
  "footer.link.process": { fr: "Le procédé", en: "The process" },
  "footer.link.journal": { fr: "Journal", en: "Journal" },
  "footer.link.modulate": { fr: "Moduler mes lunettes", en: "Modulate my glasses" },
  "footer.link.retailers": { fr: "Devenir détaillant", en: "Become a retailer" },
  "localeSwitch.aria": {
    fr: "Changer de langue — Switch language",
    en: "Switch language — Changer de langue",
  },
  "localeSwitch.toEn": { fr: "English version", en: "English version" },
  "localeSwitch.toFr": { fr: "Version française", en: "Version française" },
  "product.colors": { fr: "Coloris", en: "Colour" },
  "product.colorAria": { fr: "Coloris", en: "Colour" },
  "product.materials": { fr: "Matériaux", en: "Materials" },
  "product.dimensions": { fr: "Dimensions", en: "Dimensions" },
  "product.features": { fr: "Caractéristiques", en: "Features" },
  "product.requestCustomization": {
    fr: "Demander une personnalisation",
    en: "Request a customization",
  },
  "product.order": { fr: "Commander ce modèle", en: "Order this model" },
  "product.discover": { fr: "Découvrir", en: "Discover" },
  "product.from": { fr: "à partir de", en: "from" },
  "product.model": { fr: "modèle", en: "model" },
  "product.models": { fr: "modèles", en: "models" },
  "product.emptyGrid": {
    fr: "Aucun modèle ne correspond à ces filtres pour le moment.",
    en: "No model matches these filters for now.",
  },
  "scroll.hint": { fr: "Défilez", en: "Scroll" },
} satisfies Dict;

export type StringKey = keyof typeof strings;

/** Récupère une chaîne traduite (repli FR). */
export function t(key: StringKey, locale: Locale = DEFAULT_LOCALE): string {
  return strings[key]?.[locale] ?? strings[key]?.fr ?? key;
}

/* -------------------------------------------------------------------------- */
/*  Routage FR ↔ EN                                                            */
/* -------------------------------------------------------------------------- */

/** Pages statiques traduites : chemin FR → chemin EN. */
const STATIC_ROUTE_MAP: Record<string, string> = {
  "/": "/en",
  "/collections": "/en/collections",
  "/technologie": "/en/technology",
  "/manifeste": "/en/manifesto",
  "/about": "/en/about",
  "/contact": "/en/contact",
  "/faq": "/en/faq",
};

const STATIC_ROUTE_MAP_EN_TO_FR: Record<string, string> = Object.fromEntries(
  Object.entries(STATIC_ROUTE_MAP).map(([fr, en]) => [en, fr])
);

function normalizePath(path: string): string {
  const clean = path.split(/[?#]/)[0] || "/";
  if (clean.length > 1 && clean.endsWith("/")) return clean.slice(0, -1);
  return clean;
}

/** Locale d'un chemin donné (les routes /en/* sont anglaises). */
export function pathLocale(path: string): Locale {
  const p = normalizePath(path);
  return p === "/en" || p.startsWith("/en/") ? "en" : "fr";
}

/**
 * Chemin équivalent dans l'autre langue.
 * "/" ↔ "/en", "/collections" ↔ "/en/collections",
 * "/produits/nexus" ↔ "/en/products/nexus", etc.
 * Une page sans équivalent (configurateur, panier…) renvoie l'accueil
 * de l'autre langue.
 */
export function localeAlternate(path: string): string {
  const p = normalizePath(path);

  if (pathLocale(p) === "en") {
    // EN → FR
    if (STATIC_ROUTE_MAP_EN_TO_FR[p]) return STATIC_ROUTE_MAP_EN_TO_FR[p];
    if (p.startsWith("/en/collections/")) {
      return `/collections/${p.slice("/en/collections/".length)}`;
    }
    if (p.startsWith("/en/products/")) {
      return `/produits/${p.slice("/en/products/".length)}`;
    }
    return "/";
  }

  // FR → EN
  if (STATIC_ROUTE_MAP[p]) return STATIC_ROUTE_MAP[p];
  if (p.startsWith("/collections/")) {
    return `/en/collections/${p.slice("/collections/".length)}`;
  }
  if (p.startsWith("/produits/")) {
    return `/en/products/${p.slice("/produits/".length)}`;
  }
  return "/en";
}

/* -------------------------------------------------------------------------- */
/*  Copies structurées des sections partagées (texte FR historique inchangé)   */
/* -------------------------------------------------------------------------- */

type ManifestoBandCopy = {
  eyebrow: string;
  lines: { t: string; accent?: boolean }[][];
  paragraph: string;
};

export const MANIFESTO_BAND_COPY: Record<Locale, ManifestoBandCopy> = {
  fr: {
    eyebrow: "Le principe",
    lines: [
      [{ t: "Votre visage" }, { t: "n’est pas", accent: true }, { t: "standard." }],
      [{ t: "Vos lunettes" }, { t: "ne devraient", accent: true }, { t: "pas l’être." }],
    ],
    paragraph:
      "La fabrication additive nous libère des tailles uniques pensées pour personne. Chaque monture est imprimée à la demande, ajustée à une morphologie, accordée à un style — légère, précise, et seulement quand vous la voulez.",
  },
  en: {
    eyebrow: "The principle",
    lines: [
      [{ t: "Your face" }, { t: "was never", accent: true }, { t: "standard." }],
      [{ t: "Your glasses" }, { t: "shouldn’t be", accent: true }, { t: "either." }],
    ],
    paragraph:
      "Additive manufacturing frees us from one-size-fits-nobody. Every frame is printed on demand, fitted to a morphology, tuned to a style — light, precise, and only when you want it.",
  },
};

type MatterBandCopy = {
  eyebrow: string;
  title: string;
  points: { title: string; body: string }[];
  /** Indicateurs animés (compteurs) — laboratoire matière. */
  stats: { value: number; prefix?: string; suffix: string; label: string }[];
  layersNote: string;
};

export const MATTER_BAND_COPY: Record<Locale, MatterBandCopy> = {
  fr: {
    eyebrow: "La matière",
    title: "Légère par nature. Précise par fabrication.",
    points: [
      { title: "Légère par nature", body: "Environ 18 g sur le nez — le nylon PA12 fritté allège sans fragiliser." },
      { title: "Souple et résistante", body: "Flexible, dotée d’une bonne mémoire de forme, elle encaisse le quotidien." },
      { title: "Produite à la demande", body: "Aucun stock, aucun invendu : chaque paire est imprimée après commande, à Montréal." },
    ],
    stats: [
      { value: 18, prefix: "≈ ", suffix: " g", label: "sur le nez" },
      { value: 350, prefix: "≈ ", suffix: "", label: "couches frittées" },
      { value: 0, suffix: "", label: "stock — imprimée après commande" },
    ],
    layersNote: "PA12 · FRITTAGE SÉLECTIF PAR LASER · COUCHE ≈ 0,1 MM",
  },
  en: {
    eyebrow: "The material",
    title: "Light by nature. Precise by making.",
    points: [
      { title: "Light by nature", body: "Around 18 g on the nose — sintered PA12 nylon lightens the structure without weakening it." },
      { title: "Flexible and resilient", body: "Flexible, with excellent shape memory, it shrugs off everyday wear." },
      { title: "Made on demand", body: "No stock, nothing unsold: every pair is printed after you order it, in Montréal." },
    ],
    stats: [
      { value: 18, prefix: "≈ ", suffix: " g", label: "on the nose" },
      { value: 350, prefix: "≈ ", suffix: "", label: "sintered layers" },
      { value: 0, suffix: "", label: "stock — printed after your order" },
    ],
    layersNote: "PA12 · SELECTIVE LASER SINTERING · LAYER ≈ 0.1 MM",
  },
};

type ProcessSequenceCopy = {
  eyebrow: string;
  paragraph: string;
  steps: Record<"scan" | "design" | "print" | "finish" | "wear", string>;
};

export const PROCESS_SEQUENCE_COPY: Record<Locale, ProcessSequenceCopy> = {
  fr: {
    eyebrow: "Du visage à l’objet",
    paragraph:
      "Une chaîne numérique continue, du repère facial à la monture finie. Cinq étapes, aucune sous-traitée à l’à-peu-près.",
    steps: {
      scan: "Analyse morphologique du visage, calibrée au millimètre.",
      design: "Adaptation paramétrique de la géométrie à vos mesures.",
      print: "Frittage laser du nylon PA12, couche par couche.",
      finish: "Dépoudrage, teinte et finition contrôlée à la main.",
      wear: "Montée, contrôlée, livrée — prête à être portée.",
    },
  },
  en: {
    eyebrow: "From face to object",
    paragraph:
      "One continuous digital chain, from facial landmark to finished frame. Five steps — none of them left to approximation.",
    steps: {
      scan: "Morphological face analysis, calibrated to the millimetre.",
      design: "Parametric geometry adapted to your measurements.",
      print: "Laser sintering of PA12 nylon, layer by layer.",
      finish: "Depowdering, dyeing and hand-checked finishing.",
      wear: "Assembled, inspected, delivered — ready to wear.",
    },
  },
};

type CustomizationStepsCopy = {
  eyebrow: string;
  title: string;
  paragraph: string;
  cta: string;
  imageAlt: string;
  /** Cartouche technique du bandeau image pleine largeur (mono, uppercase). */
  imageCaption: string;
  steps: { n: string; title: string; body: string }[];
};

export const CUSTOMIZATION_STEPS_COPY: Record<Locale, CustomizationStepsCopy> = {
  fr: {
    eyebrow: "Personnalisation",
    title: "Une lunette adaptée à votre morphologie, votre style, votre personnalité.",
    paragraph:
      "Forme, couleur, branches, verres, finitions : chaque paramètre se configure. Notre parcours guidé convertit vos préférences en concepts imprimables — et votre visage devient le point de départ du design.",
    cta: "Créer ma monture",
    imageAlt: "Vue éclatée des composants modulaires — ADDITIVE",
    imageCaption: "VUE ÉCLATÉE · COMPOSANTS MODULAIRES · NYLON PA12 FRITTÉ",
    steps: [
      { n: "01", title: "Choisir une base", body: "Partez d’une monture de la collection ou d’une feuille blanche." },
      { n: "02", title: "Sélectionner la forme", body: "Panto, rectangulaire, sculpturale : la géométrie qui vous va." },
      { n: "03", title: "Choisir la couleur", body: "Teinte dans la masse : Black, White, Blue, Red, Orange…" },
      { n: "04", title: "Adapter les branches", body: "Longueur, courbure et style ajustés à votre morphologie." },
      { n: "05", title: "Choisir les verres", body: "Sans correction, correcteurs ou solaires." },
      { n: "06", title: "Ajouter une finition", body: "Satinée, micro-texturée ou premium polie." },
      { n: "07", title: "Valider le style", body: "Trois concepts générés, fidèles à votre profil." },
      { n: "08", title: "Recevoir une estimation", body: "Prix transparent, calculé sur votre configuration." },
      { n: "09", title: "Commander", body: "Ou demander un accompagnement personnalisé." },
    ],
  },
  en: {
    eyebrow: "Customization",
    title: "Eyewear tuned to your morphology, your style, your personality.",
    paragraph:
      "Shape, colour, temples, lenses, finishes: every parameter can be configured. Our guided journey turns your preferences into printable concepts — and your face becomes the design’s starting point.",
    cta: "Create my frame",
    imageAlt: "Exploded view of the modular components — ADDITIVE",
    imageCaption: "EXPLODED VIEW · MODULAR COMPONENTS · SINTERED PA12 NYLON",
    steps: [
      { n: "01", title: "Choose a base", body: "Start from a frame in the collection — or from a blank page." },
      { n: "02", title: "Select the shape", body: "Panto, rectangular, sculptural: the geometry that suits you." },
      { n: "03", title: "Pick the colour", body: "Dyed in the mass: Black, White, Blue, Red, Orange…" },
      { n: "04", title: "Fit the temples", body: "Length, curvature and style adjusted to your morphology." },
      { n: "05", title: "Choose the lenses", body: "Plano, prescription or sun." },
      { n: "06", title: "Add a finish", body: "Satin, micro-textured or polished premium." },
      { n: "07", title: "Approve the style", body: "Three generated concepts, true to your profile." },
      { n: "08", title: "Get an estimate", body: "Transparent pricing, computed from your configuration." },
      { n: "09", title: "Order", body: "Or ask for a one-on-one consultation." },
    ],
  },
};

type ScrollThreadCopy = {
  phases: {
    /** Numéro de plan technique — « 01 » à « 06 ». */
    n: string;
    eyebrow: string;
    title: string;
    sub: string;
    specs: [string, string];
    /** Micro-annotation façon cartouche de plan (mono, bas de cadre). */
    note: string;
    accent?: boolean;
  }[];
};

/** Narration 01-06 : VISAGE → PARAMÈTRES → DESIGN → IMPRESSION → FINITION → PORT. */
export const SCROLL_THREAD_COPY: Record<Locale, ScrollThreadCopy> = {
  fr: {
    phases: [
      {
        n: "01",
        eyebrow: "Visage",
        title: "Tout part de votre visage.",
        sub: "Largeur, pont, tempes : vos repères anatomiques deviennent le cahier des charges.",
        specs: ["Repères anatomiques stables", "Calibré au millimètre"],
        note: "REF. A-01 · SCAN MORPHOLOGIQUE",
      },
      {
        n: "02",
        eyebrow: "Paramètres",
        title: "Vos mesures pilotent la géométrie.",
        sub: "Chaque modèle est un système de paramètres — pas un dessin figé.",
        specs: ["Design paramétrique", "Géométrie adaptative"],
        note: "REF. A-02 · SYSTÈME PARAMÉTRIQUE",
      },
      {
        n: "03",
        eyebrow: "Design",
        title: "L’algorithme propose. Le designer décide.",
        sub: "Face, branches et verres se composent en un objet cohérent — et modulaire.",
        specs: ["Modules interchangeables", "Réparable · évolutive"],
        note: "REF. B-01 · ASSEMBLAGE MODULAIRE",
      },
      {
        n: "04",
        eyebrow: "Impression",
        title: "Imprimée couche par couche.",
        sub: "Frittage laser sélectif du nylon PA12 — sans moule, sans stock.",
        specs: ["Nylon PA12 — SLS", "≈ 350 couches"],
        note: "REF. C-01 · FRITTAGE LASER",
      },
      {
        n: "05",
        eyebrow: "Finition",
        title: "Dépoudrée, teintée, contrôlée.",
        sub: "Teinte dans la masse et finition vérifiée à la main, à Montréal.",
        specs: ["Teinte dans la masse", "Contrôle à la main"],
        note: "REF. C-02 · FINITION ATELIER",
      },
      {
        n: "06",
        eyebrow: "Port",
        title: "Conçues pour vous.",
        sub: "Environ 18 g sur le nez — produite à la demande, portée longtemps.",
        specs: ["≈ 18 g sur le nez", "Fabriquée à Montréal"],
        note: "REF. D-01 · PIÈCE UNIQUE",
        accent: true,
      },
    ],
  },
  en: {
    phases: [
      {
        n: "01",
        eyebrow: "Face",
        title: "It all starts with your face.",
        sub: "Width, bridge, temples: your anatomical landmarks become the brief.",
        specs: ["Stable anatomical landmarks", "Calibrated to the millimetre"],
        note: "REF. A-01 · MORPHOLOGICAL SCAN",
      },
      {
        n: "02",
        eyebrow: "Parameters",
        title: "Your measurements drive the geometry.",
        sub: "Every model is a system of parameters — not a frozen drawing.",
        specs: ["Parametric design", "Adaptive geometry"],
        note: "REF. A-02 · PARAMETRIC SYSTEM",
      },
      {
        n: "03",
        eyebrow: "Design",
        title: "The algorithm proposes. The designer decides.",
        sub: "Front, temples and lenses compose one coherent — and modular — object.",
        specs: ["Interchangeable modules", "Repairable · upgradable"],
        note: "REF. B-01 · MODULAR ASSEMBLY",
      },
      {
        n: "04",
        eyebrow: "Printing",
        title: "Printed layer by layer.",
        sub: "Selective laser sintering of PA12 nylon — no mould, no stock.",
        specs: ["PA12 nylon — SLS", "≈ 350 layers"],
        note: "REF. C-01 · LASER SINTERING",
      },
      {
        n: "05",
        eyebrow: "Finishing",
        title: "Depowdered, dyed, inspected.",
        sub: "Dyed in the mass and hand-checked finishing, in Montréal.",
        specs: ["Dyed in the mass", "Hand-checked"],
        note: "REF. C-02 · WORKSHOP FINISH",
      },
      {
        n: "06",
        eyebrow: "Wear",
        title: "Made for you.",
        sub: "Around 18 g on the nose — produced on demand, worn for years.",
        specs: ["≈ 18 g on the nose", "Made in Montréal"],
        note: "REF. D-01 · ONE-OFF PIECE",
        accent: true,
      },
    ],
  },
};

/* -------------------------------------------------------------------------- */
/*  Modularité (MODUL'AIR) — vue éclatée annotée                               */
/* -------------------------------------------------------------------------- */

type ModulairCopy = {
  eyebrow: string;
  title: string;
  paragraph: string;
  cta: string;
  modules: { n: string; title: string; body: string }[];
  videoNote: string;
};

export const MODULAIR_COPY: Record<Locale, ModulairCopy> = {
  fr: {
    eyebrow: "MODUL'AIR — Système modulaire",
    title: "Un système. Pas un objet figé.",
    paragraph:
      "Dans la collection MODUL'AIR, la monture est une architecture : face, branches et verres s’assemblent, se remplacent et évoluent — sans racheter la paire.",
    cta: "Explorer MODUL'AIR",
    modules: [
      { n: "M-01", title: "Face avant", body: "La structure porteuse — géométrie ajustée à votre pont et à votre largeur de visage." },
      { n: "M-02", title: "Branches", body: "Longueur et courbure adaptées à vos tempes. Remplaçables à l’unité." },
      { n: "M-03", title: "Verres", body: "Sans correction, correcteurs ou solaires — clipsés dans la même face." },
    ],
    videoNote: "VUE ÉCLATÉE · ASSEMBLAGE SANS VIS",
  },
  en: {
    eyebrow: "MODUL'AIR — Modular system",
    title: "A system. Not a frozen object.",
    paragraph:
      "In the MODUL'AIR collection, the frame is an architecture: front, temples and lenses assemble, swap and evolve — without buying the pair again.",
    cta: "Explore MODUL'AIR",
    modules: [
      { n: "M-01", title: "Front", body: "The load-bearing structure — geometry tuned to your bridge and face width." },
      { n: "M-02", title: "Temples", body: "Length and curvature fitted to your temples. Replaceable one by one." },
      { n: "M-03", title: "Lenses", body: "Plano, prescription or sun — clipped into the same front." },
    ],
    videoNote: "EXPLODED VIEW · SCREWLESS ASSEMBLY",
  },
};

/* -------------------------------------------------------------------------- */
/*  Hero — colonne méta (composition asymétrique)                              */
/* -------------------------------------------------------------------------- */

export const HERO_META_COPY: Record<Locale, { label: string; value: string }[]> = {
  fr: [
    { label: "Atelier", value: "Montréal — QC" },
    { label: "Matière", value: "Nylon PA12 · SLS" },
    { label: "Poids", value: "≈ 18 g" },
    { label: "Production", value: "À la demande" },
  ],
  en: [
    { label: "Workshop", value: "Montréal — QC" },
    { label: "Material", value: "PA12 nylon · SLS" },
    { label: "Weight", value: "≈ 18 g" },
    { label: "Production", value: "On demand" },
  ],
};

/* -------------------------------------------------------------------------- */
/*  Contenu éditorial anglais des pages /en (miroir des clés SiteContent FR)   */
/* -------------------------------------------------------------------------- */

export const EN_CONTENT = {
  hero: {
    eyebrow: "ADDITIVE EYEWEAR — Montréal",
    title: "3D-printed eyewear. Designed around you.",
    subtitle:
      "Featherlight, modular, endlessly customizable frames — designed in Montréal and printed on demand.",
    ctaPrimary: "Create my glasses",
    ctaSecondary: "Explore the collections",
  },
  marquee: [
    "3D-printed in Montréal",
    "PA12 nylon — 18 g",
    "Parametric design",
    "Made on demand",
    "Modular frames",
  ],
  brand: {
    positioning:
      "ADDITIVE is a Canadian 3D-printed eyewear brand based in Montréal. It combines modular design, additive manufacturing, morphological customization and artificial intelligence to deliver glasses that are light, strong, flexible — and built to last.",
  },
  technology: {
    title: "The ADDITIVE technology",
    intro:
      "Behind every frame stands an end-to-end digital design and manufacturing chain: parametric design, selective laser sintering, hand finishing. Here is how your glasses are actually made.",
    blocks: [
      {
        title: "SLS 3D printing",
        body: "Selective laser sintering fuses nylon powder layer by layer — no mould, no supports. It unlocks geometries injection moulding cannot touch: open lattices, variable thicknesses, integrated textures.",
      },
      {
        title: "PA12 nylon",
        body: "Polyamide 12 is light (around 18 g per finished frame), flexible, tough, and blessed with excellent shape memory. Hypoallergenic and durable — the reference material of additive eyewear.",
      },
      {
        title: "Parametric design",
        body: "Every model is a system of parameters rather than a frozen drawing: face width, lens height, bridge curvature. The frame adapts to your measurements — never the reverse.",
      },
      {
        title: "On-demand production",
        body: "No stock, no unsold pairs: each frame enters production after the order. Unsintered powder is reused from one build to the next, cutting material waste.",
      },
      {
        title: "Morphological fit",
        body: "Facial measurements — calibrated on stable anatomical landmarks — guide the fit of bridge, front and temples for genuine comfort, not catalogue comfort.",
      },
      {
        title: "Modularity",
        body: "In the MODUL’AIR collection, fronts, temples and lenses are interchangeable. Your frame evolves: a colour for summer, a spare temple, a new style — without buying the whole pair again.",
      },
    ],
  },
  manifesto: {
    title: "The ADDITIVE manifesto",
    intro:
      "ADDITIVE doesn’t just sell glasses. ADDITIVE proposes a new way to design, produce and wear a personal object. Every frame becomes an interface between face, material, style and technology.",
    sections: [
      {
        title: "Design as a sensitive algorithm",
        body: "We draw with parameters: the width of a face, the tension of a curve, the density of a structure. The algorithm proposes; the designer decides. This dialogue between computation and intuition yields forms neither approach would have found alone.",
      },
      {
        title: "Additive manufacturing as freedom",
        body: "Printing in 3D means making without moulds, without stock, without compromise. Every frame is born on demand, layer by layer — around 350 layers of sintered nylon — exactly as it was designed, exactly when it is wanted.",
      },
      {
        title: "Identity before mass production",
        body: "A pair of glasses lives at the centre of your face. It deserves better than a single size designed for no one. We believe in the configured object: fitted to a morphology, tuned to a style, true to a personality.",
      },
      {
        title: "Sustainability by design",
        body: "Producing on demand means refusing the waste of overproduction. Designing modular means enabling repair and evolution rather than replacement. Technological elegance is also an ethic of production.",
      },
    ],
    closing: "Your next pair won’t be chosen. It will be generated for you.",
  },
  faq: [
    {
      q: "Are 3D-printed glasses strong?",
      a: "Yes. Sintered PA12 nylon is used in aerospace and medical applications for its strength and flexibility. An ADDITIVE frame weighs around 18 g and springs back to shape after twisting.",
    },
    {
      q: "Can I fit prescription lenses?",
      a: "All our frames accept prescription lenses. Bring your prescription to your optician, or contact us and we will guide you through it.",
    },
    {
      q: "How long does production take?",
      a: "Every pair is made on demand in Montréal — allow roughly 2 to 3 weeks between order and delivery.",
    },
    {
      q: "How does customization work?",
      a: "You choose a base, then the shape, colour, temples, lenses and finishes. Our configurator guides you, and our team validates every configuration before production.",
    },
    {
      q: "How do I care for a 3D-printed frame?",
      a: "Clean it with lukewarm soapy water and dry it with a soft cloth. PA12 nylon handles daily wear well; simply avoid prolonged exposure to extreme heat.",
    },
    {
      q: "Can I replace a temple or a module?",
      a: "In the MODUL’AIR collection, yes: fronts, temples and lenses are interchangeable. Repair or upgrade a module without buying the pair again.",
    },
    {
      q: "Do you ship internationally?",
      a: "We ship from Montréal. For exact delivery and return terms in your country, get in touch — these details are being finalized.",
    },
  ],
  cta: {
    title: "Your next pair won’t be chosen. It will be generated for you.",
    button: "Begin",
  },
};
