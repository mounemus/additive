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
    image: p.image,
    images: [{ url: p.image, alt: p.name }],
    collection: col ? { name: col.name, slug: col.slug } : null,
    seoTitle: p.seoTitle,
    seoDescription: p.seoDescription,
  };
}

function dbProductToCatalog(p: {
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
  seoTitle: string | null;
  seoDescription: string | null;
  images: { url: string; alt: string | null }[];
  collection: { name: string; slug: string } | null;
}): CatalogProduct {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    shortDescription: stripShortcodes(p.shortDescription),
    description: stripShortcodes(p.description),
    price: p.price,
    currency: p.currency,
    colors: p.colors,
    materials: p.materials,
    dimensions: p.dimensions,
    features: p.features,
    isFeatured: p.isFeatured,
    model3dUrl: p.model3dUrl || localModelUrl(p.slug),
    image: p.images[0]?.url ?? "/images/products/placeholder.svg",
    images: p.images.map((i) => ({ url: i.url, alt: i.alt })),
    collection: p.collection,
    seoTitle: p.seoTitle,
    seoDescription: p.seoDescription,
  };
}

const productInclude = {
  images: { orderBy: { order: "asc" as const } },
  collection: { select: { name: true, slug: true } },
};

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
}): Promise<CatalogProduct[]> {
  try {
    const rows = await db.product.findMany({
      where: {
        isPublished: true,
        ...(filter?.collectionSlug
          ? { collection: { slug: filter.collectionSlug } }
          : {}),
        ...(filter?.featuredOnly ? { isFeatured: true } : {}),
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "asc" }],
      include: productInclude,
    });
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
    return rows.map(dbProductToCatalog);
  } catch {
    return PRODUCTS.filter(
      (p) =>
        (!filter?.collectionSlug || p.collectionSlug === filter.collectionSlug) &&
        (!filter?.featuredOnly || p.isFeatured)
    ).map(staticProductToCatalog);
  }
}

export async function getProduct(slug: string): Promise<CatalogProduct | null> {
  try {
    const row = await db.product.findUnique({
      where: { slug },
      include: productInclude,
    });
    if (row && row.isPublished) return dbProductToCatalog(row);
    if (row) return null;
  } catch {
    // repli statique ci-dessous
  }
  const p = PRODUCTS.find((x) => x.slug === slug);
  return p ? staticProductToCatalog(p) : null;
}

export async function getRelatedProducts(
  product: CatalogProduct,
  limit = 3
): Promise<CatalogProduct[]> {
  const all = await getProducts();
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
