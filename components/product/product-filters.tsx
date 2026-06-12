"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProductFilters({
  collections,
  colors,
}: {
  collections: { slug: string; name: string }[];
  colors: string[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const activeCollection = params.get("collection");
  const activeColor = params.get("couleur");

  function setFilter(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value === null || next.get(key) === value) next.delete(key);
    else next.set(key, value);
    router.push(`/produits${next.toString() ? `?${next}` : ""}`, { scroll: false });
  }

  const pill =
    "rounded-full border px-4 py-1.5 text-sm transition-all duration-200";

  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-4 border-b border-border pb-6">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrer par collection">
        <span className="mr-1 text-xs uppercase tracking-widest text-muted">
          Collection
        </span>
        {collections.map((c) => (
          <button
            key={c.slug}
            onClick={() => setFilter("collection", c.slug)}
            aria-pressed={activeCollection === c.slug}
            className={cn(
              pill,
              activeCollection === c.slug
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted hover:border-foreground hover:text-foreground"
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrer par couleur">
        <span className="mr-1 text-xs uppercase tracking-widest text-muted">
          Couleur
        </span>
        {colors.map((c) => (
          <button
            key={c}
            onClick={() => setFilter("couleur", c)}
            aria-pressed={activeColor === c}
            className={cn(
              pill,
              activeColor === c
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted hover:border-foreground hover:text-foreground"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {(activeCollection || activeColor) && (
        <button
          onClick={() => router.push("/produits", { scroll: false })}
          className="inline-flex items-center gap-1.5 text-sm text-muted underline-offset-4 hover:text-foreground hover:underline"
        >
          <X className="h-3.5 w-3.5" /> Réinitialiser
        </button>
      )}
    </div>
  );
}
