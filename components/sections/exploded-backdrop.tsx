"use client";

import dynamic from "next/dynamic";

const ExplodedScene = dynamic(
  () => import("@/components/three/exploded-glasses-bg").then((m) => m.ExplodedScene),
  { ssr: false, loading: () => null }
);

/**
 * Arrière-plan « vue éclatée 3D » + dégradé neutre, à placer en absolute derrière
 * le contenu d'une section sombre. Non interactif (pointer-events-none).
 */
export function ExplodedBackdrop({ modelUrl }: { modelUrl?: string }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.5]">
        <ExplodedScene modelUrl={modelUrl} />
      </div>
      {/* Fades neutres : vignettage radial + dégradé bas pour la lisibilité du texte */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 45%, transparent, rgba(11,13,16,0.55) 75%, rgba(11,13,16,0.85))",
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-b from-transparent to-[#0b0d10]" />
      <div className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-t from-transparent to-[#0b0d10]" />
    </div>
  );
}
