"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Ruler, Layers, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MagneticButton } from "@/components/motion/magnetic-button";
import { formatPrice, cn } from "@/lib/utils";
import type { CatalogProduct } from "@/lib/catalog";
import { t, type Locale } from "@/lib/i18n";

const COLOR_MAP: Record<string, string> = {
  black: "#111111",
  white: "#f5f5f2",
  blue: "#1f6fff",
  red: "#e23b2e",
  orange: "#ff6a2a",
};

export function ProductDetails({
  product,
  locale = "fr",
}: {
  product: CatalogProduct;
  locale?: Locale;
}) {
  const [selectedColor, setSelectedColor] = useState(product.colors[0] ?? null);
  // Sélection de variantes : { [nom de groupe]: libellé choisi }. Par défaut,
  // la première valeur de chaque groupe.
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(
        product.variants.map((g) => [g.name, g.values[0]?.label ?? ""])
      )
  );
  const collectionHref = (slug: string) =>
    locale === "en" ? `/en/collections/${slug}` : `/collections/${slug}`;

  // Prix affiché = base + somme des suppléments des valeurs sélectionnées.
  const variantDelta = product.variants.reduce((sum, g) => {
    const chosen = g.values.find((v) => v.label === selectedVariants[g.name]);
    return sum + (chosen?.priceDelta ?? 0);
  }, 0);
  const displayedPrice =
    product.price != null ? product.price + variantDelta : product.price;

  // Choix complet pour préremplir la demande : "Verres:Solaires|Branches:Longues".
  const variantParam = product.variants
    .map((g) => `${g.name}:${selectedVariants[g.name] ?? ""}`)
    .join("|");

  return (
    <div>
      {product.collection && (
        <Link href={collectionHref(product.collection.slug)}>
          <Badge variant="blue">{product.collection.name}</Badge>
        </Link>
      )}
      <h1 className="mt-4 font-display text-display-md font-bold">
        {product.name}
      </h1>
      <p className="mt-3 text-2xl font-medium tabular-nums">
        {formatPrice(displayedPrice, product.currency)}
      </p>
      {product.shortDescription && (
        <p className="mt-5 leading-relaxed text-muted">
          {product.shortDescription}
        </p>
      )}

      {product.colors.length > 0 && (
        <div className="mt-8">
          <p className="mb-3 text-sm font-medium">
            {t("product.colors", locale)}
            {selectedColor ? ` — ${selectedColor}` : ""}
          </p>
          <div className="flex gap-3">
            {product.colors.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedColor(c)}
                aria-label={`${t("product.colorAria", locale)} ${c}`}
                aria-pressed={selectedColor === c}
                className={cn(
                  "h-9 w-9 rounded-full ring-1 ring-black/10 transition-all",
                  selectedColor === c &&
                    "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                )}
                style={{ backgroundColor: COLOR_MAP[c.toLowerCase()] ?? "#ccc" }}
              />
            ))}
          </div>
        </div>
      )}

      {product.variants.map((group) => (
        <div key={group.name} className="mt-8">
          <p className="mb-3 text-sm font-medium">{group.name}</p>
          <div className="flex flex-wrap gap-2.5">
            {group.values.map((v) => {
              const active = selectedVariants[group.name] === v.label;
              return (
                <button
                  key={v.label}
                  type="button"
                  onClick={() =>
                    setSelectedVariants((s) => ({ ...s, [group.name]: v.label }))
                  }
                  aria-pressed={active}
                  className={cn(
                    "inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-4 text-sm transition-all",
                    active
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-surface text-foreground hover:border-foreground/40"
                  )}
                >
                  <span>{v.label}</span>
                  {v.priceDelta ? (
                    <span className="tabular-nums opacity-70">
                      +{formatPrice(v.priceDelta, product.currency)}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="mt-9 flex flex-col gap-3 sm:flex-row">
        <MagneticButton>
          <Link
            href={`/personnalisation?base=${product.slug}${selectedColor ? `&couleur=${encodeURIComponent(selectedColor)}` : ""}${variantParam ? `&variant=${encodeURIComponent(variantParam)}` : ""}`}
          >
            <Button size="lg" className="w-full sm:w-auto">
              <Sparkles className="h-4 w-4" />
              {t("product.requestCustomization", locale)}
            </Button>
          </Link>
        </MagneticButton>
        <Link
          href={`${locale === "en" ? "/en/contact" : "/contact"}?type=achat&modele=${product.slug}${variantParam ? `&variant=${encodeURIComponent(variantParam)}` : ""}`}
        >
          <Button variant="outline" size="lg" className="w-full sm:w-auto">
            {t("product.order", locale)}
          </Button>
        </Link>
      </div>

      <div className="mt-10 space-y-6 border-t border-border pt-8">
        {product.materials.length > 0 && (
          <div className="flex gap-4">
            <Layers className="mt-0.5 h-5 w-5 shrink-0 text-accent-blue" />
            <div>
              <p className="text-sm font-medium">{t("product.materials", locale)}</p>
              <p className="mt-1 text-sm text-muted">
                {product.materials.join(" · ")}
              </p>
            </div>
          </div>
        )}
        {product.dimensions && (
          <div className="flex gap-4">
            <Ruler className="mt-0.5 h-5 w-5 shrink-0 text-accent-blue" />
            <div>
              <p className="text-sm font-medium">{t("product.dimensions", locale)}</p>
              <p className="mt-1 text-sm text-muted">{product.dimensions}</p>
            </div>
          </div>
        )}
        {product.features.length > 0 && (
          <div>
            <p className="mb-3 text-sm font-medium">{t("product.features", locale)}</p>
            <ul className="space-y-2">
              {product.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-muted">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-blue" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
