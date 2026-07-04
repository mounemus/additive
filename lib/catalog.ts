// fs n'est utilisé que côté serveur (voir localModelUrl) ; le bundle client
// reçoit un module vide grâce au fallback webpack de next.config.mjs.
import fs from "fs";
import { db } from "@/lib/db";
import {
  COLLECTIONS,
  PRODUCTS,
  SITE_CONTENT,
  type StaticCollection,
  type StaticProduct,
} from "@/content/static-data";

/**
 * Couche d'accès au catalogue avec repli "mode démo" :
 * si la base de données est absente ou injoignable, le site public
 * reste consultable grâce au contenu statique (content/static-data.ts).
 * Le back-office, lui, exige une vraie base.
 */

/** Groupe de déclinaisons (« Verres », « Branches »…) façon WooCommerce. */
export type VariantValue = { label: string; priceDelta?: number };
export type VariantGroup = { name: string; values: VariantValue[] };

/**
 * Locale de contenu : `description`/`shortDescription` en base sont LE
 * FRANÇAIS ; en "en", on sert les champs `descriptionEn`/`shortDescriptionEn`
 * avec repli FR quand ils sont vides. Le contenu statique reste FR partout
 * (repli EN = FR).
 */
export type CatalogLocale = "fr" | "en";

export type CatalogProduct = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  price: number | null;
  currency: string;
  colors: string[];
  materials: string[];
  dimensions: string | null;
  features: string[];
  isFeatured: boolean;
  model3dUrl: string | null;
  variants: VariantGroup[];
  image: string;
  images: { url: string; alt: string | null }[];
  collection: { name: string; slug: string } | null;
  seoTitle: string | null;
  seoDescription: string | null;
};

export type CatalogCollection = {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  image: string | null;
  video: string | null;
  productCount: number;
  /** Prix du modèle le moins cher de la collection (affichage « À partir de »). */
  minPrice: number | null;
  seoTitle: string | null;
  seoDescription: string | null;
};

function minPriceOf(prices: (number | null)[]): number | null {
  const nums = prices.filter((p): p is number => typeof p === "number" && p > 0);
  return nums.length ? Math.min(...nums) : null;
}

/**
 * Nettoie les shortcodes WordPress hérités des descriptions importées
 * (ex. `[3d_viewer id="3098"]`, `[gallery]…[/gallery]`) : balises ouvrantes,
 * fermantes et auto-fermantes. Retourne null si le texte devient vide.
 */
const SHORTCODE_RE = /\[\/?[a-z0-9_]+[^\]]*\]/gi;

export function stripShortcodes(text: string | null): string | null {
  if (!text) return text;
  const cleaned = text
    .replace(SHORTCODE_RE, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return cleaned.length ? cleaned : null;
}

/**
 * Mapping automatique d'un modèle 3D local : si `public/models/<slug>.glb`
 * existe, on l'utilise pour les produits sans model3dUrl en base.
 * Vérification fs côté serveur uniquement, mémoïsée par slug.
 */
const localModelCache = new Map<string, string | null>();

function localModelUrl(slug: string): string | null {
  if (typeof window !== "undefined") return null;
  const cached = localModelCache.get(slug);
  if (cached !== undefined) return cached;
  let url: string | null = null;
  // Slug strictement alphanumérique/tirets : évite toute traversée de chemin.
  if (/^[a-z0-9][a-z0-9-]*$/i.test(slug)) {
    try {
      if (
        typeof fs?.existsSync === "function" &&
        fs.existsSync(`${process.cwd()}/public/models/${slug}.glb`)
      ) {
        url = `/models/${slug}.glb`;
      }
    } catch {
      url = null;
    }
  }
  localModelCache.set(slug, url);
  return url;
}

/**
 * Les GLB hébergés sur buypukka.ca (WordPress) n'envoient pas de CORS et
 * l'hôte n'est pas dans notre CSP connect-src : on les sert via le proxy
 * same-origin /api/model-proxy. Les URL Vercel Blob / locales passent telles
 * quelles.
 */
const PROXIED_MODEL_PREFIX = "https://buypukka.ca";

function proxiedModelUrl(url: string | null): string | null {
  if (!url) return url;
  if (url.startsWith(PROXIED_MODEL_PREFIX)) {
    return `/api/model-proxy?src=${encodeURIComponent(url)}`;
  }
  return url;
}

/**
 * Parse défensif du Json `variants` stocké en base : on ne garde que les
 * groupes bien formés ({name, values[{label, priceDelta?}]}), tableau vide
 * pour tout le reste (null, format inattendu, données héritées…).
 */
export function parseVariants(raw: unknown): VariantGroup[] {
  if (!Array.isArray(raw)) return [];
  const groups: VariantGroup[] = [];
  for (const g of raw) {
    if (!g || typeof g !== "object") continue;
    const name = (g as { name?: unknown }).name;
    const values = (g as { values?: unknown }).values;
    if (typeof name !== "string" || !name.trim() || !Array.isArray(values)) continue;
    const clean: VariantValue[] = [];
    for (const v of values) {
      if (!v || typeof v !== "object") continue;
      const label = (v as { label?: unknown }).label;
      const priceDelta = (v as { priceDelta?: unknown }).priceDelta;
      if (typeof label !== "string" || !label.trim()) continue;
      clean.push(
        typeof priceDelta === "number" && Number.isFinite(priceDelta) && priceDelta !== 0
          ? { label, priceDelta }
          : { label }
      );
    }
    if (clean.length) groups.push({ name, values: clean });
  }
  return groups;
}

function staticCollectionToCatalog(c: StaticCollection): CatalogCollection {
  return {
    id: `static-${c.slug}`,
    name: c.name,
    slug: c.slug,
    tagline: c.tagline,
    description: c.description,
    image: c.image,
    video: null,
    productCount: PRODUCTS.filter((p) => p.collectionSlug === c.slug).length,
    minPrice: minPriceOf(PRODUCTS.filter((p) => p.collectionSlug === c.slug).map((p) => p.price)),
    seoTitle: c.seoTitle,
    seoDescription: c.seoDescription,
  };
}

function staticProductToCatalog(p: StaticProduct): CatalogProduct {
  const col = COLLECTIONS.find((c) => c.slug === p.collectionSlug);
  return {
    id: `static-${p.slug}`,
    name: p.name,
    slug: p.slug,
    shortDescription: stripShortcodes(p.shortDescription),
    description: stripShortcodes(p.description),
    price: p.price,
    currency: "CAD",
    colors: p.colors,
    materials: p.materials,
    dimensions: p.dimensions,
    features: p.features,
    isFeatured: p.isFeatured,
    model3dUrl: localModelUrl(p.slug),
    variants: [],
    image: p.image,
    images: [{ url: p.image, alt: p.name }],
    collection: col ? { name: col.name, slug: col.slug } : null,
    seoTitle: p.seoTitle,
    seoDescription: p.seoDescription,
  };
}

export function dbProductToCatalog(p: {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  shortDescriptionEn?: string | null;
  descriptionEn?: string | null;
  price: number | null;
  currency: string;
  colors: string[];
  materials: string[];
  dimensions: string | null;
  features: string[];
  isFeatured: boolean;
  model3dUrl: string | null;
  variants?: unknown;
  seoTitle: string | null;
  seoDescription: string | null;
  images: { url: string; alt: string | null }[];
  collection: { name: string; slug: string } | null;
}, locale: CatalogLocale = "fr"): CatalogProduct {
  // EN : champs traduits s'ils sont renseignés, repli FR sinon.
  const shortDescription =
    locale === "en" && p.shortDescriptionEn?.trim()
      ? p.shortDescriptionEn
      : p.shortDescription;
  const description =
    locale === "en" && p.descriptionEn?.trim() ? p.descriptionEn : p.description;
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    shortDescription: stripShortcodes(shortDescription),
    description: stripShortcodes(description),
    price: p.price,
    currency: p.currency,
    colors: p.colors,
    materials: p.materials,
    dimensions: p.dimensions,
    features: p.features,
    isFeatured: p.isFeatured,
    model3dUrl: proxiedModelUrl(p.model3dUrl) || localModelUrl(p.slug),
    variants: parseVariants(p.variants),
    image: p.images[0]?.url ?? "/images/products/placeholder.svg",
    images: p.images.map((i) => ({ url: i.url, alt: i.alt })),
    collection: p.collection,
    seoTitle: p.seoTitle,
    seoDescription: p.seoDescription,
  };
}

/**
 * Sélections produit explicites. Les colonnes `descriptionEn` /
 * `shortDescriptionEn` peuvent ne pas encore exister en base (le code est
 * déployé avant le `prisma db push`) : on tente d'abord la requête complète,
 * puis on retombe sur la sélection SANS ces colonnes si la base répond
 * « colonne inconnue » (P2022). Le repli est mémoïsé pour le process — les
 * pages EN utilisent alors le français (repli normal).
 */
const productSelect = {
  id: true,
  name: true,
  slug: true,
  shortDescription: true,
  description: true,
  price: true,
  currency: true,
  colors: true,
  materials: true,
  dimensions: true,
  features: true,
  isFeatured: true,
  isPublished: true,
  model3dUrl: true,
  variants: true,
  seoTitle: true,
  seoDescription: true,
  images: { orderBy: { order: "asc" as const } },
  collection: { select: { name: true, slug: true } },
};

const productSelectEn = {
  ...productSelect,
  shortDescriptionEn: true,
  descriptionEn: true,
};

let enColumnsMissing = false;

function isMissingColumnError(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    (e as { code?: unknown }).code === "P2022"
  );
}

async function withEnFallback<T>(
  withEn: () => Promise<T>,
  withoutEn: () => Promise<T>
): Promise<T> {
  if (!enColumnsMissing) {
    try {
      return await withEn();
    } catch (e) {
      if (!isMissingColumnError(e)) throw e;
      enColumnsMissing = true;
    }
  }
  return withoutEn();
}

export async function getCollections(): Promise<CatalogCollection[]> {
  try {
    const rows = await db.collection.findMany({
      where: { isPublished: true },
      orderBy: { order: "asc" },
      include: {
        _count: { select: { products: { where: { isPublished: true } } } },
        products: { where: { isPublished: true }, select: { price: true } },
      },
    });
    if (rows.length === 0) return COLLECTIONS.map(staticCollectionToCatalog);
    return rows.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      tagline: c.tagline,
      description: c.description,
      image: c.image,
      video: c.video,
      productCount: c._count.products,
      minPrice: minPriceOf(c.products.map((p) => p.price)),
      seoTitle: c.seoTitle,
      seoDescription: c.seoDescription,
    }));
  } catch {
    return COLLECTIONS.map(staticCollectionToCatalog);
  }
}

export async function getCollection(
  slug: string
): Promise<CatalogCollection | null> {
  const all = await getCollections();
  return all.find((c) => c.slug === slug) ?? null;
}

export async function getProducts(filter?: {
  collectionSlug?: string;
  featuredOnly?: boolean;
  /** "en" : descriptions traduites (repli FR). Défaut "fr". */
  locale?: CatalogLocale;
}): Promise<CatalogProduct[]> {
  const locale: CatalogLocale = filter?.locale ?? "fr";
  try {
    const where = {
      isPublished: true,
      ...(filter?.collectionSlug
        ? { collection: { slug: filter.collectionSlug } }
        : {}),
      ...(filter?.featuredOnly ? { isFeatured: true } : {}),
    };
    const orderBy = [
      { isFeatured: "desc" as const },
      { createdAt: "asc" as const },
    ];
    const rows = await withEnFallback(
      () => db.product.findMany({ where, orderBy, select: productSelectEn }),
      () => db.product.findMany({ where, orderBy, select: productSelect })
    );
    if (rows.length === 0 && !filter?.collectionSlug && !filter?.featuredOnly) {
      return PRODUCTS.map(staticProductToCatalog);
    }
    if (rows.length === 0) {
      return PRODUCTS.filter(
        (p) =>
          (!filter?.collectionSlug || p.collectionSlug === filter.collectionSlug) &&
          (!filter?.featuredOnly || p.isFeatured)
      ).map(staticProductToCatalog);
    }
    return rows.map((row) => dbProductToCatalog(row, locale));
  } catch {
    return PRODUCTS.filter(
      (p) =>
        (!filter?.collectionSlug || p.collectionSlug === filter.collectionSlug) &&
        (!filter?.featuredOnly || p.isFeatured)
    ).map(staticProductToCatalog);
  }
}

export async function getProduct(
  slug: string,
  locale: CatalogLocale = "fr"
): Promise<CatalogProduct | null> {
  try {
    const row = await withEnFallback(
      () => db.product.findUnique({ where: { slug }, select: productSelectEn }),
      () => db.product.findUnique({ where: { slug }, select: productSelect })
    );
    if (row && row.isPublished) return dbProductToCatalog(row, locale);
    if (row) return null;
  } catch {
    // repli statique ci-dessous
  }
  const p = PRODUCTS.find((x) => x.slug === slug);
  return p ? staticProductToCatalog(p) : null;
}

export async function getRelatedProducts(
  product: CatalogProduct,
  limit = 3,
  locale: CatalogLocale = "fr"
): Promise<CatalogProduct[]> {
  const all = await getProducts({ locale });
  return all
    .filter((p) => p.slug !== product.slug)
    .sort((a, b) => {
      const sameA = a.collection?.slug === product.collection?.slug ? 0 : 1;
      const sameB = b.collection?.slug === product.collection?.slug ? 0 : 1;
      return sameA - sameB;
    })
    .slice(0, limit);
}

/** Contenu éditorial : DB d'abord, repli statique sinon. */
export async function getContent<T>(key: string): Promise<T> {
  try {
    const row = await db.siteContent.findUnique({ where: { key } });
    if (row) return row.value as T;
  } catch {
    // repli statique
  }
  return SITE_CONTENT[key] as T;
}
