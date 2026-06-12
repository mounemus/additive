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

export const customizationRequestSchema = z.object({
  name: z.string().min(2, "Votre nom est requis").max(120),
  email: z.string().email("Adresse email invalide"),
  phone: z.string().max(30).optional().or(z.literal("")),
  faceShape: z.string().max(40).optional(),
  styleTags: z.array(z.string().max(40)).max(8).default([]),
  boldness: z.string().max(40).optional(),
  conceptLabel: z.string().max(120).optional(),
  conceptSummary: z.string().max(2000).optional(),
  options: z.record(z.string(), z.string()).optional(),
  message: z.string().max(5000).optional().or(z.literal("")),
});

export type CustomizationRequestInput = z.infer<typeof customizationRequestSchema>;

export const estimateSchema = z.object({
  conceptLabel: z.string().min(1).max(120),
  boldness: z.enum(["discret", "equilibre", "affirme"]),
  lensType: z.enum(["sans-correction", "correction", "solaire"]),
  finish: z.enum(["standard", "premium"]),
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
