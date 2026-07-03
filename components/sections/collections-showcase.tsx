"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CollectionCard } from "@/components/product/collection-card";
import type { CatalogCollection } from "@/lib/catalog";
import type { Locale } from "@/lib/i18n";

/**
 * Vitrine éditoriale des collections : chaque carte (composant partagé,
 * inchangé) est enrichie d'une identité propre — index, signature et motif
 * SVG animé au survol :
 *   MODUL'AIR  → système / lignes techniques ;
 *   GENERATIVE → géométrie expressive (onde) ;
 *   HYBRIDE    → artisanat premium (hachures).
 */

type IdentityKey = "modulair" | "generative" | "hybride";

const IDENTITY_LABELS: Record<IdentityKey, { fr: string; en: string }> = {
  modulair: { fr: "Système modulaire", en: "Modular system" },
  generative: { fr: "Géométrie générative", en: "Generative geometry" },
  hybride: { fr: "Artisanat hybride", en: "Hybrid craft" },
};

function identityOf(slug: string, index: number): IdentityKey {
  const s = slug.toLowerCase();
  if (s.includes("modul")) return "modulair";
  if (s.includes("generat")) return "generative";
  if (s.includes("hybrid")) return "hybride";
  return (["modulair", "generative", "hybride"] as const)[index % 3];
}

function IdentityMotif({ kind }: { kind: IdentityKey }) {
  const reduce = useReducedMotion();
  const common = {
    initial: reduce ? undefined : { pathLength: 0 },
    variants: { hover: { pathLength: 1 } },
    transition: { duration: 0.6, ease: "easeOut" as const },
  };
  return (
    <svg aria-hidden viewBox="0 0 64 16" fill="none" className="h-4 w-16">
      {kind === "modulair" && (
        <>
          {/* Lignes techniques — modules segmentés */}
          <motion.path d="M2 8 H20 M24 8 H42 M46 8 H62" stroke="var(--accent-blue)" strokeWidth="1.4" {...common} />
          <motion.path d="M20 3 V13 M42 3 V13" stroke="var(--accent-blue)" strokeWidth="1" opacity="0.5" {...common} />
        </>
      )}
      {kind === "generative" && (
        /* Onde paramétrique expressive */
        <motion.path
          d="M2 8 C 10 1, 18 15, 26 8 S 42 1, 50 8 S 60 13, 62 8"
          stroke="var(--accent-blue)"
          strokeWidth="1.4"
          {...common}
        />
      )}
      {kind === "hybride" && (
        /* Hachures artisanales */
        <motion.path
          d="M4 14 L14 2 M14 14 L24 2 M24 14 L34 2 M34 14 L44 2 M44 14 L54 2"
          stroke="var(--accent-blue)"
          strokeWidth="1.2"
          {...common}
        />
      )}
    </svg>
  );
}

export function CollectionsShowcase({
  collections,
  locale = "fr",
}: {
  collections: CatalogCollection[];
  locale?: Locale;
}) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {collections.map((c, i) => {
        const kind = identityOf(c.slug, i);
        return (
          <motion.div key={c.slug} whileHover="hover" className="group/identity">
            <CollectionCard collection={c} index={i} locale={locale} />
            {/* Signature éditoriale sous la carte */}
            <div className="mt-4 flex items-center justify-between gap-4 border-t border-border pt-3">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-[10px] tracking-[0.2em] text-accent-blue">
                  C-{String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-xs uppercase tracking-[0.2em] text-muted transition-colors duration-300 group-hover/identity:text-foreground">
                  {IDENTITY_LABELS[kind][locale]}
                </span>
              </div>
              <IdentityMotif kind={kind} />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
