import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(2, "Votre nom est requis").max(120),
  email: z.string().email("Adresse email invalide"),
  phone: z.string().max(30).optional().or(z.literal("")),
  type: z.enum(["achat", "personnalisation", "partenariat", "presse", "investisseur", "autre"], {
    errorMap: () => ({ message: "Choisissez un type de demande" }),
  }),
  message: z.string().min(10, "Dites-nous en un peu plus (10 caractères minimum)").max(5000),
});

export type ContactInput = z.infer<typeof contactSchema>;

// ── Options du devis (ids libres, validés contre la grille admin côté calcul) ─
export const quoteOptionsSchema = z.object({
  conceptLabel: z.string().max(120).optional(),
  boldness: z.enum(["discret", "equilibre", "affirme"]).default("equilibre"),
  material: z.string().max(60).default("pa12-standard"),
  finish: z.string().max(60).default("standard"),
  lensType: z.string().max(60).default("sans-correction"),
  delivery: z.string().max(60).default("standard"),
  urgency: z.string().max(60).default("none"),
});

export type QuoteOptionsInput = z.infer<typeof quoteOptionsSchema>;

export const customizationRequestSchema = z.object({
  name: z.string().min(2, "Votre nom est requis").max(120),
  email: z.string().email("Adresse email invalide"),
  phone: z.string().max(30).optional().or(z.literal("")),
  faceShape: z.string().max(40).optional(),
  measurements: z.record(z.string(), z.number()).optional(),
  analysisReport: z.unknown().optional(),
  styleTags: z.array(z.string().max(40)).max(8).default([]),
  boldness: z.string().max(40).optional(),
  conceptLabel: z.string().max(120).optional(),
  conceptSummary: z.string().max(2000).optional(),
  conceptData: z.unknown().optional(),
  matchRate: z.number().int().min(0).max(100).optional(),
  moodboardUrl: z.string().max(300000).optional(),
  options: quoteOptionsSchema.partial().optional(),
  photoToken: z.string().max(120).optional(),
  message: z.string().max(5000).optional().or(z.literal("")),
});

export type CustomizationRequestInput = z.infer<typeof customizationRequestSchema>;

// ── Génération IA (serveur) ──────────────────────────────────────────────────
export const moodboardGenSchema = z.object({
  styleTags: z.array(z.string().max(40)).max(8).default([]),
  faceShape: z.string().max(40).optional(),
});

export const conceptsGenSchema = z.object({
  styleTags: z.array(z.string().max(40)).max(8).default([]),
  faceShape: z.string().max(40).optional(),
  boldness: z.enum(["discret", "equilibre", "affirme"]).default("equilibre"),
  moodboardImage: z.string().max(8_000_000).optional(),
});

export const wornPortraitSchema = z.object({
  conceptLabel: z.string().max(120),
  styleTags: z.array(z.string().max(40)).max(8).default([]),
  photo: z.string().max(8_000_000), // data URL de la photo du client
});

export const analysisReportSchema = z.object({
  measurements: z.record(z.string(), z.number()),
  faceShape: z.string().max(40).optional(),
});

// ── Photo temporaire ─────────────────────────────────────────────────────────
export const tempPhotoSchema = z.object({
  dataUrl: z.string().max(8_000_000),
  kind: z.enum(["capture", "snapshot", "portrait"]).default("capture"),
});

// ── Réglages admin du configurateur ─────────────────────────────────────────
export const providersAdminSchema = z.object({
  imageProvider: z.string().max(40).optional(),
  imageModel: z.string().max(80).optional(),
  visionProvider: z.string().max(40).optional(),
  keys: z.record(z.string(), z.string().max(400)).optional(),
});

export const providerTestSchema = z.object({
  providerId: z.string().max(40),
  key: z.string().min(1).max(400),
});

export const pricingAdminSchema = z.object({
  currency: z.string().max(8),
  base: z.number().min(0),
  materials: z.array(z.object({ id: z.string(), label: z.string(), note: z.string(), price: z.number() })),
  finishes: z.array(z.object({ id: z.string(), label: z.string(), note: z.string(), price: z.number() })),
  lenses: z.array(z.object({ id: z.string(), label: z.string(), note: z.string(), price: z.number() })),
  delivery: z.array(z.object({ id: z.string(), label: z.string(), note: z.string(), price: z.number() })),
  urgency: z.array(z.object({ id: z.string(), label: z.string(), note: z.string(), price: z.number() })),
  complexity: z.object({ low: z.number(), medium: z.number(), high: z.number() }),
  marginRate: z.number().min(0).max(1),
});

export const productSchema = z.object({
  name: z.string().min(1, "Nom requis").max(160),
  slug: z
    .string()
    .min(1, "Slug requis")
    .max(160)
    .regex(/^[a-z0-9-]+$/, "Slug invalide (minuscules, chiffres, tirets)"),
  shortDescription: z.string().max(500).optional().or(z.literal("")),
  description: z.string().max(10000).optional().or(z.literal("")),
  price: z.coerce.number().min(0).nullable().optional(),
  currency: z.string().default("CAD"),
  collectionId: z.string().optional().or(z.literal("")),
  colors: z.array(z.string().max(60)).default([]),
  materials: z.array(z.string().max(120)).default([]),
  dimensions: z.string().max(300).optional().or(z.literal("")),
  features: z.array(z.string().max(300)).default([]),
  images: z
    .array(z.object({ url: z.string().min(1), alt: z.string().max(200).optional().or(z.literal("")) }))
    .default([]),
  customizable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  seoTitle: z.string().max(200).optional().or(z.literal("")),
  seoDescription: z.string().max(400).optional().or(z.literal("")),
});

export type ProductInput = z.infer<typeof productSchema>;

export const collectionSchema = z.object({
  name: z.string().min(1, "Nom requis").max(160),
  slug: z
    .string()
    .min(1, "Slug requis")
    .max(160)
    .regex(/^[a-z0-9-]+$/, "Slug invalide (minuscules, chiffres, tirets)"),
  tagline: z.string().max(300).optional().or(z.literal("")),
  description: z.string().max(5000).optional().or(z.literal("")),
  image: z.string().max(1000).optional().or(z.literal("")),
  video: z.string().max(1000).optional().or(z.literal("")),
  order: z.coerce.number().int().default(0),
  isPublished: z.boolean().default(false),
  seoTitle: z.string().max(200).optional().or(z.literal("")),
  seoDescription: z.string().max(400).optional().or(z.literal("")),
});

export type CollectionInput = z.infer<typeof collectionSchema>;

export const mediaSchema = z.object({
  url: z.string().min(1, "URL requise").max(1000),
  alt: z.string().max(200).optional().or(z.literal("")),
  kind: z.enum(["image", "video", "render3d", "texture", "moodboard", "autre"]).default("image"),
});

export const requestStatusSchema = z.object({
  status: z.enum(["new", "in_progress", "answered", "archived"]),
  note: z.string().max(2000).optional().or(z.literal("")),
});
