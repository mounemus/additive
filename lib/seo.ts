import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n";
import { PUBLIC_URL } from "@/lib/base-path";

export const SITE_NAME = "ADDITIVE";

/** URL canonique publique, basePath inclus (https://buypukka.ca/additive). */
export const SITE_URL = PUBLIC_URL;

const DEFAULT_DESCRIPTION =
  "ADDITIVE — Lunetterie modulaire imprimée en 3D à Montréal. Des lunettes générées pour votre visage, imprimées pour votre style. Design paramétrique, nylon PA12, personnalisation morphologique.";

/** JSON-LD Organization pour le layout public (schema.org). */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
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
export function productJsonLd(
  product: {
    name: string;
    slug: string;
    description?: string | null;
    shortDescription?: string | null;
    image: string;
    price: number | null;
    currency: string;
  },
  locale: Locale = "fr"
) {
  const image = product.image.startsWith("http")
    ? product.image
    : `${SITE_URL}${product.image}`;
  const productPath =
    locale === "en" ? `/en/products/${product.slug}` : `/produits/${product.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description:
      product.shortDescription ?? product.description ?? DEFAULT_DESCRIPTION,
    image,
    url: `${SITE_URL}${productPath}`,
    brand: { "@type": "Brand", name: SITE_NAME },
    ...(product.price != null
      ? {
          offers: {
            "@type": "Offer",
            price: product.price,
            priceCurrency: product.currency || "CAD",
            availability: "https://schema.org/InStock",
            url: `${SITE_URL}${productPath}`,
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
  locale = "fr",
  alternate,
}: {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  /** Locale de la page (défaut "fr" — rendu FR historique inchangé). */
  locale?: Locale;
  /**
   * Chemin de la même page dans l'autre langue (ex. "/en/collections" pour
   * "/collections"). Génère les hreflang fr-CA/en-CA réciproques.
   */
  alternate?: string;
}): Metadata {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Lunettes imprimées en 3D, modulaires et personnalisées | Montréal`;
  const desc = description ?? DEFAULT_DESCRIPTION;
  const url = `${SITE_URL}${path}`;

  const languages =
    alternate != null
      ? {
          "fr-CA": locale === "fr" ? url : `${SITE_URL}${alternate}`,
          "en-CA": locale === "en" ? url : `${SITE_URL}${alternate}`,
          // Par défaut, la version française (racine) fait référence.
          "x-default": locale === "fr" ? url : `${SITE_URL}${alternate}`,
        }
      : undefined;

  return {
    title: fullTitle,
    description: desc,
    metadataBase: new URL(SITE_URL),
    alternates: { canonical: url, ...(languages ? { languages } : {}) },
    openGraph: {
      title: fullTitle,
      description: desc,
      url,
      siteName: SITE_NAME,
      locale: locale === "en" ? "en_CA" : "fr_CA",
      type: "website",
      // Absolu : metadataBase porte /additive, qu'une URL "/x" résolue écraserait.
      ...(image ? { images: [{ url: image.startsWith("/") ? `${SITE_URL}${image}` : image }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: desc,
    },
  };
}
