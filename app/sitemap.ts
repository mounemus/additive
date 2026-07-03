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
    "/faq",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  // Pages statiques anglaises (/en/…), miroir des pages marketing traduites.
  const staticPagesEn = [
    "/en",
    "/en/collections",
    "/en/technology",
    "/en/manifesto",
    "/en/about",
    "/en/contact",
    "/en/faq",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "/en" ? 0.9 : 0.7,
  }));

  return [
    ...staticPages,
    ...staticPagesEn,
    ...collections.map((c) => ({
      url: `${SITE_URL}/collections/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    ...collections.map((c) => ({
      url: `${SITE_URL}/en/collections/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...products.map((p) => ({
      url: `${SITE_URL}/produits/${p.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...products.map((p) => ({
      url: `${SITE_URL}/en/products/${p.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
