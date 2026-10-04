"use client";

import { withBase } from "@/lib/base-path";
import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Rotate3d } from "lucide-react";
import { Model3DViewer } from "@/components/product/model-3d-viewer";
import { useProductColor } from "@/components/product/product-color-context";
import { colorHex } from "@/components/product/color-dots";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";

const LABELS = {
  hint: {
    fr: "Faites pivoter — pincez pour zoomer",
    en: "Drag to rotate — pinch to zoom",
  },
  tab3d: { fr: "Vue 3D interactive", en: "Interactive 3D view" },
  views: { fr: "Vues du produit", en: "Product views" },
  view: { fr: "Vue", en: "View" },
} as const;

type GalleryView =
  | { kind: "3d"; src: string }
  | { kind: "image"; url: string; alt: string | null };

/**
 * Galerie produit. Quand un modèle 3D existe, il devient l'onglet PRINCIPAL
 * (premier, actif par défaut), les photos suivent en miniatures.
 */
export function ProductGallery({
  images,
  name,
  model3dUrl,
  locale = "fr",
}: {
  images: { url: string; alt: string | null }[];
  name: string;
  model3dUrl?: string | null;
  locale?: Locale;
}) {
  const photos: GalleryView[] = (
    images.length ? images : [{ url: "/images/products/placeholder.svg", alt: name }]
  ).map((img) => ({ kind: "image" as const, ...img }));

  const views: GalleryView[] = model3dUrl
    ? [{ kind: "3d", src: model3dUrl }, ...photos]
    : photos;

  const [active, setActive] = useState(0);
  const current = views[active] ?? views[0];
  const posterUrl = photos[0]?.kind === "image" ? photos[0].url : undefined;

  // Coloris choisi sur la fiche (ProductColorProvider) : recolore le GLB du
  // visualiseur principal. Le GLB représente déjà le coloris par défaut → on
  // n'applique un hex que si la sélection en diffère (même logique que
  // l'essayage 3D). Hex inconnu ou hors provider → matériaux d'origine.
  const [selectedColor, , defaultColor] = useProductColor(null);
  const frameColorHex =
    selectedColor && selectedColor !== defaultColor
      ? colorHex(selectedColor)
      : null;

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-[#0a0a0a]">
        {current.kind === "3d" ? (
          <>
            <Model3DViewer
              src={withBase(current.src)}
              alt={`${name} — ${LABELS.tab3d[locale]}`}
              poster={withBase(posterUrl)}
              locale={locale}
              frameColorHex={frameColorHex}
              className="absolute inset-0 h-full w-full"
            />
            <p className="pointer-events-none absolute right-4 top-4 rounded-full bg-black/45 px-3 py-1.5 text-xs text-white backdrop-blur">
              {LABELS.hint[locale]}
            </p>
          </>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="relative h-full w-full"
            >
              <Image
                src={withBase(current.url)}
                alt={current.alt ?? `${name} — ${LABELS.view[locale]} ${active + 1}`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover"
              />
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {views.length > 1 && (
        <div className="mt-4 flex gap-3" role="tablist" aria-label={LABELS.views[locale]}>
          {views.map((view, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === active}
              aria-label={
                view.kind === "3d"
                  ? LABELS.tab3d[locale]
                  : `${LABELS.view[locale]} ${i + (model3dUrl ? 0 : 1)}`
              }
              onClick={() => setActive(i)}
              className={cn(
                "focus-ring relative h-20 w-24 overflow-hidden rounded-xl border-2 transition-all duration-200",
                i === active
                  ? "border-foreground"
                  : "border-transparent opacity-60 hover:opacity-100"
              )}
            >
              {view.kind === "3d" ? (
                <span className="flex h-full w-full flex-col items-center justify-center gap-1 bg-surface-dark text-white">
                  <Rotate3d aria-hidden className="h-5 w-5 text-accent-blue" />
                  <span className="text-[11px] font-medium tracking-wide">3D</span>
                </span>
              ) : (
                <Image src={withBase(view.url)} alt="" fill sizes="96px" className="object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
