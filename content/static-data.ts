/**
 * Contenu initial ADDITIVE — extrait du site WordPress existant
 * (additive.buypukka.ca) et des documents de reconstruction.
 *
 * Ce fichier sert deux usages :
 *  1. source du seed Prisma (prisma/seed.ts) ;
 *  2. repli "mode démo" quand aucune base de données n'est connectée
 *     (lib/catalog.ts), pour que le site reste consultable en local.
 */

export type StaticCollection = {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  image: string;
  order: number;
  seoTitle: string;
  seoDescription: string;
};

export type StaticProduct = {
  name: string;
  slug: string;
  collectionSlug: string;
  shortDescription: string;
  description: string;
  price: number | null;
  colors: string[];
  materials: string[];
  dimensions: string | null;
  features: string[];
  isFeatured: boolean;
  isPublished: boolean;
  image: string;
  seoTitle: string;
  seoDescription: string;
};

export const COLLECTIONS: StaticCollection[] = [
  {
    name: "MODUL’AIR",
    slug: "modulair",
    tagline: "La lunette devient un système.",
    description:
      "Une collection modulaire pensée pour composer une monture personnelle à partir de formes, branches, couleurs et finitions interchangeables. MODUL’AIR transforme la lunette en système évolutif : faces, branches et verres se combinent, se remplacent et évoluent avec vous.",
    image: "/images/collections/modulair.svg",
    order: 1,
    seoTitle: "MODUL’AIR — Montures modulaires imprimées en 3D",
    seoDescription:
      "MODUL’AIR : la collection modulaire d’ADDITIVE. Faces, branches, verres et finitions interchangeables. Lunettes imprimées en 3D à Montréal, personnalisables et évolutives.",
  },
  {
    name: "GENERATIVE",
    slug: "generative",
    tagline: "Des géométries que la main seule n’aurait pas dessinées.",
    description:
      "Une collection expressive inspirée par le design génératif, les formes paramétriques et l’intelligence artificielle. Chaque monture explore une géométrie sculpturale, contemporaine et distinctive — née d’une collaboration entre design humain et algorithmes.",
    image: "/images/collections/generative.svg",
    order: 2,
    seoTitle: "GENERATIVE — Lunettes au design génératif et paramétrique",
    seoDescription:
      "GENERATIVE : silhouettes sculpturales issues du design génératif et de l’IA. Lunettes futuristes imprimées en 3D en nylon PA12, conçues à Montréal.",
  },
  {
    name: "HYBRIDE",
    slug: "hybride",
    tagline: "L’artisanat numérique rencontre la matière.",
    description:
      "Une collection qui combine fabrication additive, finitions premium et détails inspirés de l’artisanat numérique. HYBRIDE propose une élégance technologique plus sobre, raffinée et matérielle — la fusion des techniques traditionnelles et des matériaux modernes.",
    image: "/images/collections/hybride.svg",
    order: 3,
    seoTitle: "HYBRIDE — Lunettes premium, fabrication additive et artisanat",
    seoDescription:
      "HYBRIDE : la rencontre de l’impression 3D et de la finition artisanale. Montures sophistiquées, matériaux contrastés, détails premium. ADDITIVE, Montréal.",
  },
];

const DIMENSIONS_STD =
  "Verre 53 mm · Hauteur 43,5 mm · Pont 17 mm · Largeur totale 125 mm · Branches 135 mm";
const COLORS_STD = ["Black", "White", "Blue", "Red", "Orange"];
const MATERIALS_STD = ["Nylon PA12 (impression SLS)", "Verres personnalisables"];
const FEATURES_STD = [
  "Impression 3D SLS à la demande",
  "Environ 18 g — légèreté et mémoire de forme",
  "Structure flexible et robuste",
  "Charnières ajustables",
  "Finition micro-texturée premium",
];

export const PRODUCTS: StaticProduct[] = [
  {
    name: "Nexus",
    slug: "nexus",
    collectionSlug: "generative",
    shortDescription:
      "Monture sculpturale imprimée en 3D, pensée pour un style futuriste, affirmé et architectural.",
    description:
      "Nexus explore la rencontre entre géométrie, confort et fabrication additive. Sa silhouette contemporaine met en valeur des lignes tendues, des volumes maîtrisés et une présence forte sur le visage. Nexus invite à exprimer une personnalité singulière et affirmée : son design attire le regard tout en conservant une structure légère et confortable. Pensée pour les amateurs de design distinctif, Nexus incarne l’approche générative d’ADDITIVE.",
    price: 250,
    colors: COLORS_STD,
    materials: MATERIALS_STD,
    dimensions: DIMENSIONS_STD,
    features: FEATURES_STD,
    isFeatured: true,
    isPublished: true,
    image: "/images/products/nexus.svg",
    seoTitle: "Nexus — Monture générative imprimée en 3D",
    seoDescription:
      "Nexus : monture sculpturale au style futuriste et architectural. Nylon PA12, 5 coloris, impression 3D à la demande à Montréal. 250 $ CAD.",
  },
  {
    name: "Synthesis",
    slug: "synthesis",
    collectionSlug: "hybride",
    shortDescription:
      "Une monture équilibrée entre précision numérique, confort quotidien et esthétique premium.",
    description:
      "Synthesis propose une lecture plus discrète et sophistiquée de la lunette imprimée en 3D. Sa structure associe légèreté, ergonomie et détails maîtrisés, avec des lignes sportives héritées de l’ingénierie additive. Elle convient aux utilisateurs qui recherchent une monture contemporaine, élégante et facile à porter au quotidien.",
    price: 250,
    colors: COLORS_STD,
    materials: MATERIALS_STD,
    dimensions: DIMENSIONS_STD,
    features: FEATURES_STD,
    isFeatured: true,
    isPublished: true,
    image: "/images/products/synthesis.svg",
    seoTitle: "Synthesis — Monture hybride premium imprimée en 3D",
    seoDescription:
      "Synthesis : équilibre entre précision numérique et confort quotidien. Monture imprimée en 3D, nylon PA12, esthétique premium. ADDITIVE Montréal. 250 $ CAD.",
  },
  {
    name: "Stellar",
    slug: "stellar",
    collectionSlug: "modulair",
    shortDescription:
      "Une monture modulaire, légère et expressive, conçue pour évoluer avec le style de son utilisateur.",
    description:
      "Stellar incarne l’esprit MODUL’AIR : une lunette pensée comme un système ouvert. Les formes, les branches, les couleurs et les finitions peuvent évoluer pour composer une identité visuelle personnelle. Sa silhouette fluide, élégante et prospective dépasse les codes classiques de la lunetterie. Stellar est une base idéale pour explorer la personnalisation additive.",
    price: 250,
    colors: COLORS_STD,
    materials: MATERIALS_STD,
    dimensions: DIMENSIONS_STD,
    features: [
      ...FEATURES_STD,
      "Branches et faces interchangeables (système MODUL’AIR)",
    ],
    isFeatured: true,
    isPublished: true,
    image: "/images/products/stellar.svg",
    seoTitle: "Stellar — Monture modulaire imprimée en 3D",
    seoDescription:
      "Stellar : monture modulaire et évolutive de la collection MODUL’AIR. Branches, faces et finitions interchangeables. Impression 3D, Montréal. 250 $ CAD.",
  },
  {
    name: "Ikona",
    slug: "ikona",
    collectionSlug: "generative",
    shortDescription:
      "Une icône graphique de la collection GENERATIVE : présence assumée, géométrie nette.",
    description:
      "Ikona affirme le langage visuel d’ADDITIVE : une face graphique au caractère immédiat, adoucie par une ergonomie étudiée. Une monture pour celles et ceux qui veulent qu’un objet du quotidien devienne une signature.",
    price: 250,
    colors: COLORS_STD,
    materials: MATERIALS_STD,
    dimensions: null,
    features: FEATURES_STD,
    isFeatured: false,
    isPublished: true,
    image: "/images/products/ikona.svg",
    seoTitle: "Ikona — Lunettes design génératif",
    seoDescription:
      "Ikona : monture graphique de la collection GENERATIVE. Lunettes imprimées en 3D en nylon PA12, design paramétrique, Montréal.",
  },
  {
    name: "Skecham",
    slug: "skecham",
    collectionSlug: "generative",
    shortDescription:
      "Un tracé spontané figé dans la matière : l’esquisse devenue monture.",
    description:
      "Skecham capture l’énergie d’un croquis : des lignes vives, presque dessinées à main levée, que l’impression 3D fige dans un nylon léger et résistant. Une pièce expressive pour un style libre.",
    price: 250,
    colors: COLORS_STD,
    materials: MATERIALS_STD,
    dimensions: null,
    features: FEATURES_STD,
    isFeatured: false,
    isPublished: true,
    image: "/images/products/skecham.svg",
    seoTitle: "Skecham — Lunettes génératives expressives",
    seoDescription:
      "Skecham : monture expressive de la collection GENERATIVE d’ADDITIVE. Impression 3D nylon PA12, production à la demande à Montréal.",
  },
  {
    name: "Prodigy",
    slug: "prodigy",
    collectionSlug: "generative",
    shortDescription:
      "Une géométrie précoce et brillante : la promesse générative à l’état pur.",
    description:
      "Prodigy pousse l’exploration paramétrique vers une silhouette nerveuse et précise. Chaque courbe est calculée, chaque allègement structurel est dessiné par l’algorithme puis validé par l’œil du designer.",
    price: 250,
    colors: COLORS_STD,
    materials: MATERIALS_STD,
    dimensions: null,
    features: FEATURES_STD,
    isFeatured: false,
    isPublished: true,
    image: "/images/products/prodigy.svg",
    seoTitle: "Prodigy — Monture paramétrique imprimée en 3D",
    seoDescription:
      "Prodigy : silhouette nerveuse et précise née du design paramétrique. Collection GENERATIVE, impression 3D, ADDITIVE Montréal.",
  },
  {
    name: "Orbit",
    slug: "orbit",
    collectionSlug: "generative",
    shortDescription:
      "Des courbes en orbite autour du regard : rondeur, douceur, futurisme.",
    description:
      "Orbit privilégie les courbes continues et les transitions douces. Une monture enveloppante, confortable, qui apporte une rondeur futuriste au langage génératif d’ADDITIVE.",
    price: 250,
    colors: COLORS_STD,
    materials: MATERIALS_STD,
    dimensions: null,
    features: FEATURES_STD,
    isFeatured: false,
    isPublished: true,
    image: "/images/products/orbit.svg",
    seoTitle: "Orbit — Lunettes rondes génératives",
    seoDescription:
      "Orbit : courbes continues et rondeur futuriste. Monture imprimée en 3D de la collection GENERATIVE. ADDITIVE, Montréal.",
  },
  {
    name: "Haptic",
    slug: "haptic",
    collectionSlug: "generative",
    shortDescription:
      "Pensée pour le mouvement : maintien, légèreté et texture tactile.",
    description:
      "Haptic explore la dimension sensorielle de la fabrication additive : une micro-texture agréable au toucher, un maintien sûr et une légèreté pensée pour les journées actives.",
    price: null,
    colors: COLORS_STD,
    materials: MATERIALS_STD,
    dimensions: null,
    features: FEATURES_STD,
    isFeatured: false,
    isPublished: true,
    image: "/images/products/haptic.svg",
    seoTitle: "Haptic — Monture sport imprimée en 3D",
    seoDescription:
      "Haptic : maintien, légèreté et texture tactile. Monture active de la collection GENERATIVE d’ADDITIVE, imprimée en 3D à Montréal.",
  },
  {
    name: "Aurora",
    slug: "aurora",
    collectionSlug: "generative",
    shortDescription:
      "Un panto réinventé par l’impression 3D : classique dans l’esprit, additif dans la matière.",
    description:
      "Aurora revisite la forme panto à travers le prisme additif : proportions intemporelles, structure allégée et détails de fabrication impossibles à mouler. Le pont entre héritage et futur.",
    price: null,
    colors: COLORS_STD,
    materials: MATERIALS_STD,
    dimensions: null,
    features: FEATURES_STD,
    isFeatured: false,
    isPublished: true,
    image: "/images/products/aurora.svg",
    seoTitle: "Aurora — Panto imprimé en 3D",
    seoDescription:
      "Aurora : la forme panto réinventée par la fabrication additive. Lunettes imprimées en 3D, nylon PA12, ADDITIVE Montréal.",
  },
  {
    name: "Cyborg",
    slug: "cyborg",
    collectionSlug: "modulair",
    shortDescription:
      "Le module le plus radical de MODUL’AIR : assemblages apparents et caractère technique.",
    description:
      "Cyborg assume l’esthétique de l’assemblage : fixations visibles, modules contrastés, vocabulaire technique. Une monture qui se compose et se recompose comme un instrument personnel.",
    price: null,
    colors: COLORS_STD,
    materials: MATERIALS_STD,
    dimensions: null,
    features: [...FEATURES_STD, "Modules interchangeables (système MODUL’AIR)"],
    isFeatured: false,
    isPublished: true,
    image: "/images/products/cyborg.svg",
    seoTitle: "Cyborg — Monture modulaire technique",
    seoDescription:
      "Cyborg : esthétique d’assemblage et modules interchangeables. Collection MODUL’AIR, lunettes imprimées en 3D à Montréal.",
  },
  {
    name: "Cygnus",
    slug: "cygnus",
    collectionSlug: "modulair",
    shortDescription:
      "L’élégance modulaire : des lignes étirées, des combinaisons infinies.",
    description:
      "Cygnus apporte la fluidité au système MODUL’AIR : une face élancée qui accueille des branches et des verres interchangeables sans jamais sacrifier la grâce de la silhouette.",
    price: null,
    colors: COLORS_STD,
    materials: MATERIALS_STD,
    dimensions: null,
    features: [...FEATURES_STD, "Branches interchangeables (système MODUL’AIR)"],
    isFeatured: false,
    isPublished: true,
    image: "/images/products/cygnus.svg",
    seoTitle: "Cygnus — Monture modulaire élégante",
    seoDescription:
      "Cygnus : élégance modulaire, branches et verres interchangeables. Collection MODUL’AIR d’ADDITIVE, impression 3D, Montréal.",
  },
  {
    name: "Eclipso",
    slug: "eclipso",
    collectionSlug: "modulair",
    shortDescription:
      "Jeux d’ombres et de superpositions : la modularité comme langage graphique.",
    description:
      "Eclipso superpose les plans comme une éclipse superpose les astres : faces et contre-faces se combinent pour créer des effets de profondeur et de couleur uniques à chaque configuration.",
    price: null,
    colors: COLORS_STD,
    materials: MATERIALS_STD,
    dimensions: null,
    features: [...FEATURES_STD, "Faces superposables (système MODUL’AIR)"],
    isFeatured: false,
    isPublished: true,
    image: "/images/products/eclipso.svg",
    seoTitle: "Eclipso — Monture modulaire à superpositions",
    seoDescription:
      "Eclipso : superpositions graphiques et modularité. Collection MODUL’AIR, lunettes imprimées en 3D personnalisables, Montréal.",
  },
  {
    name: "Quantum",
    slug: "quantum",
    collectionSlug: "hybride",
    shortDescription:
      "Fabrication additive et artisanat : la matière au service de la sophistication.",
    description:
      "Quantum incarne la philosophie HYBRIDE : un cœur imprimé en 3D, des finitions travaillées à la main, des matériaux contrastés. Une monture discrète de loin, fascinante de près.",
    price: 250,
    colors: COLORS_STD,
    materials: [...MATERIALS_STD, "Détails de finition artisanale"],
    dimensions: null,
    features: FEATURES_STD,
    isFeatured: false,
    isPublished: true,
    image: "/images/products/quantum.svg",
    seoTitle: "Quantum — Monture hybride artisanat et impression 3D",
    seoDescription:
      "Quantum : fusion de la fabrication additive et de la finition artisanale. Collection HYBRIDE d’ADDITIVE, Montréal. 250 $ CAD.",
  },
];

/** Contenus éditoriaux administrables (clés SiteContent). */
export const SITE_CONTENT: Record<string, unknown> = {
  hero: {
    eyebrow: "Lunetterie additive — Montréal",
    title: "Des lunettes générées pour votre visage, imprimées pour votre style.",
    subtitle:
      "ADDITIVE conçoit des montures modulaires imprimées en 3D : design paramétrique, nylon PA12, personnalisation morphologique. Une nouvelle génération de lunettes, fabriquée à la demande.",
    ctaPrimary: "Explorer la collection",
    ctaSecondary: "Créer ma monture",
  },
  slogans: [
    "Des lunettes générées pour votre visage, imprimées pour votre style.",
    "La lunette devient modulaire.",
    "Design numérique. Fabrication additive. Identité personnelle.",
    "Votre monture ne se choisit plus. Elle se configure.",
    "Une nouvelle génération de lunettes imprimées en 3D.",
  ],
  brand: {
    positioning:
      "Additive est une marque canadienne de lunettes imprimées en 3D basée à Montréal. Elle combine design modulaire, fabrication additive, personnalisation morphologique et intelligence artificielle pour proposer des lunettes légères, robustes, flexibles et plus durables.",
    taglineFr:
      "Des lunettes imprimées en 3D, modulaires et personnalisables, conçues pour ton visage, ton style et ton quotidien.",
    taglineEn:
      "Customizable 3D-printed modular glasses designed around your face, your style, and your everyday life.",
  },
  manifesto: {
    title: "Le manifeste ADDITIVE",
    intro:
      "ADDITIVE ne vend pas seulement des lunettes. ADDITIVE propose une nouvelle manière de concevoir, produire et porter un objet personnel. Chaque monture devient une interface entre le visage, la matière, le style et la technologie.",
    sections: [
      {
        title: "Le design comme algorithme sensible",
        body: "Nous dessinons avec des paramètres : largeur d’un visage, tension d’une courbe, densité d’une structure. L’algorithme propose, le designer dispose. Ce dialogue entre calcul et intuition produit des formes qu’aucune des deux approches n’aurait trouvées seule.",
      },
      {
        title: "La fabrication additive comme liberté",
        body: "Imprimer en 3D, c’est fabriquer sans moule, sans stock, sans compromis. Chaque monture naît à la demande, couche par couche — environ 350 couches de nylon fritté — exactement comme elle a été conçue, exactement quand elle est désirée.",
      },
      {
        title: "L’identité avant la série",
        body: "Une paire de lunettes vit au centre du visage. Elle mérite mieux qu’une taille unique pensée pour personne. Nous croyons à l’objet configuré : adapté à une morphologie, accordé à un style, fidèle à une personnalité.",
      },
      {
        title: "La durabilité par le design",
        body: "Produire à la demande, c’est refuser le gaspillage de la surproduction. Concevoir modulaire, c’est permettre la réparation et l’évolution plutôt que le remplacement. L’élégance technologique est aussi une éthique de production.",
      },
    ],
    closing:
      "Votre prochaine paire ne sera pas choisie. Elle sera générée pour vous.",
  },
  technology: {
    title: "La technologie ADDITIVE",
    intro:
      "Derrière chaque monture, une chaîne de conception et de fabrication numérique de bout en bout : design paramétrique, frittage sélectif par laser, finition manuelle. Voici comment vos lunettes sont réellement fabriquées.",
    blocks: [
      {
        title: "Impression 3D SLS",
        body: "Le frittage sélectif par laser (SLS) fusionne une poudre de nylon couche par couche, sans support ni moule. Il autorise des géométries impossibles en injection : structures ajourées, épaisseurs variables, textures intégrées.",
      },
      {
        title: "Nylon PA12",
        body: "Le polyamide 12 est léger (environ 18 g par monture finie), flexible, robuste et doté d’une excellente mémoire de forme. Hypoallergénique et durable, c’est le matériau de référence de la lunetterie additive.",
      },
      {
        title: "Design paramétrique",
        body: "Chaque modèle est un système de paramètres plutôt qu’un dessin figé : largeur de face, hauteur de verre, courbure du pont. La monture s’adapte aux mesures plutôt que l’inverse.",
      },
      {
        title: "Production à la demande",
        body: "Pas de stock, pas d’invendus : chaque paire est lancée en fabrication après la commande. La poudre non frittée est réutilisée d’une production à l’autre, réduisant le gaspillage de matière.",
      },
      {
        title: "Personnalisation morphologique",
        body: "Les mesures du visage — calibrées sur des repères anatomiques stables — guident l’ajustement du pont, de la face et des branches pour un confort réel, pas un confort de catalogue.",
      },
      {
        title: "Modularité",
        body: "Sur la collection MODUL’AIR, faces, branches et verres sont interchangeables. Votre monture évolue : une couleur pour l’été, une branche de rechange, un nouveau style sans racheter l’ensemble.",
      },
    ],
  },
  faq: [
    {
      q: "Les lunettes imprimées en 3D sont-elles solides ?",
      a: "Oui. Le nylon PA12 fritté est utilisé dans l’aéronautique et le médical pour sa robustesse et sa flexibilité. Une monture ADDITIVE pèse environ 18 g et retrouve sa forme après torsion.",
    },
    {
      q: "Puis-je mettre des verres correcteurs ?",
      a: "Toutes nos montures acceptent des verres correcteurs. Apportez votre prescription chez votre opticien ou contactez-nous pour un accompagnement.",
    },
    {
      q: "Combien de temps prend la fabrication ?",
      a: "Chaque paire étant produite à la demande à Montréal, comptez généralement de 2 à 3 semaines entre la commande et la livraison.",
    },
    {
      q: "Comment fonctionne la personnalisation ?",
      a: "Vous choisissez une base, puis la forme, la couleur, les branches, les verres et les finitions. Notre configurateur vous guide et notre équipe valide chaque configuration avant production.",
    },
  ],
  cta: {
    title: "Votre prochaine paire ne sera pas choisie. Elle sera générée pour vous.",
    button: "Commencer",
  },
  settings: {
    siteName: "ADDITIVE",
    contactEmail: "hello@additive.ca",
    location: "Montréal, Québec, Canada",
    currency: "CAD",
    instagram: "https://instagram.com/additive.eyewear",
    seoTitle:
      "ADDITIVE — Lunettes imprimées en 3D, modulaires et personnalisées | Montréal",
    seoDescription:
      "Lunetterie modulaire imprimée en 3D à Montréal. Design paramétrique, nylon PA12, personnalisation morphologique, production à la demande.",
  },
};
