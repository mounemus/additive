import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { getCollections, getProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [collections, products] = await Promise.all([
    getCollections(),
    getProducts(),
  ]);

  const staticPages = [
    "",
    "/collections",
    "/produits",
    "/personnalisation",
    "/technologie",
    "/manifeste",
    "/about",
    "/contact",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  return [
    ...staticPages,
    ...collections.map((c) => ({
      url: `${SITE_URL}/collections/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    ...products.map((p) => ({
      url: `${SITE_URL}/produits/${p.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
