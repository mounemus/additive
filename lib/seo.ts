import type { Metadata } from "next";

export const SITE_NAME = "ADDITIVE";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const DEFAULT_DESCRIPTION =
  "ADDITIVE — Lunetterie modulaire imprimée en 3D à Montréal. Des lunettes générées pour votre visage, imprimées pour votre style. Design paramétrique, nylon PA12, personnalisation morphologique.";

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
