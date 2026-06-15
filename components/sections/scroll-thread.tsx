"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import { motion, useScroll, useTransform, useMotionValueEvent, type MotionValue } from "framer-motion";
import { Loader2 } from "lucide-react";

/**
 * Fil rouge animé piloté au scroll — une VRAIE monture 3D (React Three Fiber)
 * tourne et se met en lumière au fil du défilement. Chaque phase ajoute des
 * légendes + annotations techniques (specs) qui occupent l'espace, plus un rail
 * de progression. R3F importé dynamiquement (ssr:false).
 */
const Glasses3D = dynamic(
  () => import("@/components/three/glasses-3d").then((m) => m.Glasses3D),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center text-muted">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    ),
  }
);

const PHASES = [
  {
    eyebrow: "01 — Conception",
    title: "Conçue autour de vous.",
    sub: "La géométrie s’adapte à vos mesures — pas l’inverse.",
    specs: ["Design paramétrique", "Calibré au millimètre"],
  },
  {
    eyebrow: "02 — Modularité",
    title: "Une géométrie. Des modules.",
    sub: "Face, branches et verres se composent et se remplacent.",
    specs: ["Modules interchangeables", "Réparable · évolutive"],
  },
  {
    eyebrow: "03 — Fabrication",
    title: "Imprimée couche par couche.",
    sub: "Frittage laser du nylon, sans moule ni stock.",
    specs: ["Nylon PA12 — SLS", "≈ 350 couches"],
  },
  {
    eyebrow: "04 — Identité",
    title: "Conçues pour vous.",
    sub: "Produite à la demande à Montréal — environ 18 g.",
    specs: ["≈ 18 g sur le nez", "Fabriquée à Montréal"],
    accent: true,
  },
];

// Fenêtres d'opacité par phase (apparition/maintien/disparition).
const WINDOWS: [number, number, number, number][] = [
  [0, 0.05, 0.19, 0.26],
  [0.28, 0.35, 0.47, 0.54],
  [0.56, 0.63, 0.74, 0.81],
  [0.83, 0.9, 1, 1],
];

export function ScrollThread({ modelUrl }: { modelUrl?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => (progressRef.current = v));

  // Une opacité par phase (appels inconditionnels, ordre stable).
  const o0 = useTransform(scrollYProgress, WINDOWS[0], [0, 1, 1, 0]);
  const o1 = useTransform(scrollYProgress, WINDOWS[1], [0, 1, 1, 0]);
  const o2 = useTransform(scrollYProgress, WINDOWS[2], [0, 1, 1, 0]);
  const o3 = useTransform(scrollYProgress, WINDOWS[3], [0, 1, 1, 1]);
  const opacities = [o0, o1, o2, o3];

  const railScale = useTransform(scrollYProgress, [0, 1], [0.04, 1]);

  return (
    <section ref={ref} className="section-dark relative h-[320vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Scène 3D plein cadre */}
        <div className="absolute inset-0">
          <Glasses3D progressRef={progressRef} modelUrl={modelUrl} />
        </div>
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(75% 75% at 50% 48%, transparent, rgba(11,13,16,0.6))" }}
        />

        {/* Couches par phase : légende centrée + annotations techniques */}
        {PHASES.map((ph, i) => (
          <motion.div
            key={i}
            style={{ opacity: opacities[i] }}
            className="pointer-events-none absolute inset-0"
          >
            <div className="absolute inset-x-0 top-[12vh] flex flex-col items-center px-6 text-center">
              <p className="eyebrow mb-3">{ph.eyebrow}</p>
              <h2
                className={`max-w-3xl font-display text-display-lg font-bold leading-[0.95] ${
                  ph.accent ? "text-accent-blue" : ""
                }`}
              >
                {ph.title}
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-muted md:text-base">
                {ph.sub}
              </p>
            </div>
            <SpecChip className="left-[5vw] top-[44vh] hidden md:flex" label={ph.specs[0]} />
            <SpecChip className="bottom-[24vh] right-[5vw] hidden md:flex" label={ph.specs[1]} />
          </motion.div>
        ))}

        {/* Rail de progression vertical (gauche) */}
        <div className="absolute left-6 top-1/2 hidden h-40 -translate-y-1/2 lg:block">
          <div className="relative h-full w-px bg-white/10">
            <motion.div
              style={{ scaleY: railScale }}
              className="absolute inset-0 origin-top w-px bg-accent-blue"
            />
          </div>
        </div>

        {/* Barre de progression + indice bas */}
        <div className="absolute inset-x-0 bottom-7 flex flex-col items-center gap-3">
          <div className="h-px w-40 overflow-hidden bg-white/12">
            <motion.div style={{ scaleX: scrollYProgress }} className="h-full origin-left bg-accent-blue" />
          </div>
          <span className="text-xs uppercase tracking-[0.3em] text-muted">Défilez</span>
        </div>
      </div>
    </section>
  );
}

function SpecChip({ label, className }: { label: string; className?: string }) {
  return (
    <div
      className={`absolute items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 backdrop-blur-sm ${className ?? ""}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-accent-blue" />
      <span className="font-mono text-xs tracking-wide text-white/80">{label}</span>
    </div>
  );
}

// Conserve le type importé même si l'inférence suffit (lisibilité).
export type ScrollThreadOpacity = MotionValue<number>;
