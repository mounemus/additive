"use client";

import { withBase } from "@/lib/base-path";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ColorDots } from "@/components/product/color-dots";
import { formatPrice } from "@/lib/utils";
import type { CatalogProduct } from "@/lib/catalog";
import type { Locale } from "@/lib/i18n";

const CTA = { fr: "Voir le modèle", en: "View the model" } as const;

/**
 * Badges techniques discrets dérivés des matériaux/caractéristiques
 * (PA12 · SLS · Custom fit) — au plus trois, jamais inventés.
 */
function techBadges(product: CatalogProduct, locale: Locale): string[] {
  const haystack = [...product.materials, ...product.features]
    .join(" ")
    .toLowerCase();
  const out: string[] = [];
  if (haystack.includes("pa12") || haystack.includes("pa 12")) out.push("PA12");
  if (haystack.includes("sls") || haystack.includes("fritt") || haystack.includes("sinter"))
    out.push("SLS");
  if (
    haystack.includes("mesure") ||
    haystack.includes("custom") ||
    haystack.includes("fit")
  )
    out.push(locale === "en" ? "Custom fit" : "Sur mesure");
  return out.slice(0, 3);
}

export function ProductCard({
  product,
  locale = "fr",
}: {
  product: CatalogProduct;
  locale?: Locale;
}) {
  const href =
    locale === "en" ? `/en/products/${product.slug}` : `/produits/${product.slug}`;
  const badges = techBadges(product, locale);

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-card-hover motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <Link href={href} className="focus-ring block rounded-2xl">
        <div className="relative aspect-[4/3] overflow-hidden bg-[#0a0a0a]">
          <Image
            src={withBase(product.image)}
            alt={product.images[0]?.alt ?? product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04] group-focus-visible:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
          {product.collection && (
            <Badge
              variant="muted"
              className="absolute left-4 top-4 bg-black/40 text-white backdrop-blur"
            >
              {product.collection.name}
            </Badge>
          )}

          {/* CTA « Voir le modèle » : apparaît au survol / focus clavier. */}
          <span
            aria-hidden
            className="absolute bottom-4 left-4 inline-flex translate-y-2 items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-1.5 text-xs font-medium text-black opacity-0 shadow-card transition-[opacity,transform] duration-200 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 motion-reduce:transition-none"
          >
            {CTA[locale]}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>

        <div className="flex items-start justify-between gap-4 p-5">
          <div>
            <h3 className="font-display text-lg font-semibold">{product.name}</h3>
            {product.shortDescription && (
              <p className="mt-1 line-clamp-2 text-sm text-muted">
                {product.shortDescription}
              </p>
            )}
            {badges.length > 0 && (
              <p className="mt-2.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
                {badges.join(" · ")}
              </p>
            )}
            <ColorDots colors={product.colors} className="mt-3" />
          </div>
          <p className="shrink-0 text-sm font-medium tabular-nums">
            {formatPrice(product.price, product.currency)}
          </p>
        </div>
      </Link>
    </article>
  );
}
