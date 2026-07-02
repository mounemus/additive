import type { Metadata } from "next";

export const SITE_NAME = "ADDITIVE";

function sanitizeUrl(raw: string | undefined): string {
  const fallback = "http://localhost:3000";
  if (!raw) return fallback;
  const trimmed = raw.trim().replace(/\/+$/, "");
  try {
    new URL(trimmed);
    return trimmed;
  } catch {
    return fallback;
  }
}

export const SITE_URL = sanitizeUrl(process.env.NEXT_PUBLIC_SITE_URL);

const DEFAULT_DESCRIPTION =
  "ADDITIVE — Lunetterie modulaire imprimée en 3D à Montréal. Des lunettes générées pour votre visage, imprimées pour votre style. Design paramétrique, nylon PA12, personnalisation morphologique.";

/** JSON-LD Organization pour le layout public (schema.org). */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: "https://additive-blue.vercel.app",
    logo: `${SITE_URL}/logo.svg`,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Montréal",
      addressRegion: "QC",
      addressCountry: "CA",
    },
  };
}

/** JSON-LD Product pour les fiches produit (offers seulement si prix connu). */
export function productJsonLd(product: {
  name: string;
  slug: string;
  description?: string | null;
  shortDescription?: string | null;
  image: string;
  price: number | null;
  currency: string;
}) {
  const image = product.image.startsWith("http")
    ? product.image
    : `${SITE_URL}${product.image}`;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description:
      product.shortDescription ?? product.description ?? DEFAULT_DESCRIPTION,
    image,
    url: `${SITE_URL}/produits/${product.slug}`,
    brand: { "@type": "Brand", name: SITE_NAME },
    ...(product.price != null
      ? {
          offers: {
            "@type": "Offer",
            price: product.price,
            priceCurrency: product.currency || "CAD",
            availability: "https://schema.org/InStock",
            url: `${SITE_URL}/produits/${product.slug}`,
          },
        }
      : {}),
  };
}

export function buildMetadata({
  title,
  description,
  path = "/",
  image,
}: {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
}): Metadata {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Lunettes imprimées en 3D, modulaires et personnalisées | Montréal`;
  const desc = description ?? DEFAULT_DESCRIPTION;
  const url = `${SITE_URL}${path}`;

  return {
    title: fullTitle,
    description: desc,
    metadataBase: new URL(SITE_URL),
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description: desc,
      url,
      siteName: SITE_NAME,
      locale: "fr_CA",
      type: "website",
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: desc,
    },
  };
}
