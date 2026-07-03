"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";
import {
  GlassesFallback,
  SceneErrorBoundary,
  supportsWebGL,
} from "@/components/three/glasses-fallback";
import { SCROLL_THREAD_COPY, t, type Locale } from "@/lib/i18n";

/**
 * Fil rouge 3D piloté au scroll — narration technique 01→06
 * (VISAGE → PARAMÈTRES → DESIGN → IMPRESSION → FINITION → PORT).
 * Chaque phase = un écran dense : numéro fantôme, titre, annotations
 * ancrées à la monture par de fines lignes animées (pathLength), cartouche
 * de plan. La monture (R3F) tourne au fil du défilement.
 *
 * Replis : WebGL absent, GLB en échec, petit écran ou reduced-motion →
 * rendu produit + plan technique (jamais de vide).
 */
const Glasses3D = dynamic(
  () => import("@/components/three/glasses-3d").then((m) => m.Glasses3D),
  { ssr: false, loading: () => null }
);

/** Fenêtre d'opacité d'une phase i parmi n : [in, hold, hold, out]. */
function phaseWindow(i: number, n: number): [number, number, number, number] {
  const a = i / n;
  const b = (i + 1) / n;
  const fade = (b - a) * 0.28;
  if (i === 0) return [0, 0.001, b - fade, b];
  if (i === n - 1) return [a, a + fade, 1, 1];
  return [a, a + fade, b - fade, b];
}

export function ScrollThread({
  modelUrl,
  locale = "fr",
}: {
  modelUrl?: string;
  locale?: Locale;
}) {
  const PHASES = SCROLL_THREAD_COPY[locale].phases;
  const n = PHASES.length;
  const ref = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => (progressRef.current = v));

  // Choix du rendu central : 3D seulement si WebGL + écran md+ + motion OK.
  const [scene, setScene] = useState<"3d" | "fallback" | null>(null);
  useEffect(() => {
    const small = window.matchMedia("(max-width: 767px)").matches;
    setScene(!small && !reduce && supportsWebGL() ? "3d" : "fallback");
  }, [reduce]);

  const railScale = useTransform(scrollYProgress, [0, 1], [1 / n, 1]);

  return (
    <section ref={ref} className="section-dark relative h-[360vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Scène centrale : monture 3D (ou repli technique) plein cadre */}
        <div className="absolute inset-0">
          {scene === "3d" && (
            <SceneErrorBoundary fallback={<GlassesFallback />}>
              <Glasses3D progressRef={progressRef} modelUrl={modelUrl} />
            </SceneErrorBoundary>
          )}
          {scene === "fallback" && <GlassesFallback />}
        </div>
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(75% 75% at 50% 48%, transparent 40%, rgba(11,13,16,0.62))",
          }}
        />

        {/* Couches par phase */}
        {PHASES.map((ph, i) => (
          <PhaseLayer
            key={ph.n}
            phase={ph}
            index={i}
            total={n}
            progress={scrollYProgress}
          />
        ))}

        {/* Rail vertical numéroté 01→06 (gauche) */}
        <div className="absolute left-6 top-1/2 hidden -translate-y-1/2 lg:block">
          <div className="relative flex flex-col gap-4">
            <div className="absolute left-[3px] top-1 h-[calc(100%-8px)] w-px bg-white/10" />
            <motion.div
              style={{ scaleY: railScale }}
              className="absolute left-[3px] top-1 h-[calc(100%-8px)] w-px origin-top bg-accent-blue"
            />
            {PHASES.map((ph, i) => (
              <RailTick key={ph.n} label={ph.n} index={i} total={n} progress={scrollYProgress} />
            ))}
          </div>
        </div>

        {/* Barre de progression + indice bas */}
        <div className="absolute inset-x-0 bottom-6 flex flex-col items-center gap-2.5">
          <div className="h-px w-40 overflow-hidden bg-white/10">
            <motion.div
              style={{ scaleX: scrollYProgress }}
              className="h-full origin-left bg-accent-blue"
            />
          </div>
          <span className="text-xs uppercase tracking-[0.3em] text-muted">
            {t("scroll.hint", locale)}
          </span>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

type Phase = (typeof SCROLL_THREAD_COPY)["fr"]["phases"][number];

/**
 * Une phase = un écran dense : composition asymétrique alternée (titre à
 * gauche/droite), specs ancrées par de fines lignes convergeant vers la
 * monture, cartouche technique en pied de cadre.
 */
function PhaseLayer({
  phase,
  index,
  total,
  progress,
}: {
  phase: Phase;
  index: number;
  total: number;
  progress: MotionValue<number>;
}) {
  const [a, b, c, d] = phaseWindow(index, total);
  const opacity = useTransform(progress, [a, b, c, d], [0, 1, 1, index === total - 1 ? 1 : 0]);
  const draw = useTransform(progress, [a, Math.min(b + (b - a) * 0.6, c)], [0, 1]);
  const rise = useTransform(progress, [a, b], [28, 0]);
  const left = index % 2 === 0;

  return (
    <motion.div style={{ opacity }} className="pointer-events-none absolute inset-0">
      {/* Bloc titre — alterné gauche/droite (centré sur mobile) */}
      <motion.div
        style={{ y: rise }}
        className={`absolute inset-x-6 top-[10vh] md:inset-x-auto md:top-[13vh] md:max-w-xl ${
          left ? "md:left-[6vw] md:text-left" : "md:right-[6vw] md:text-right"
        } text-center`}
      >
        <span
          aria-hidden
          className="text-outline pointer-events-none block font-display text-[clamp(4rem,10vw,9rem)] font-bold leading-none"
        >
          {phase.n}
        </span>
        <p className="eyebrow -mt-3 mb-3 md:-mt-5">
          {phase.n} — {phase.eyebrow}
        </p>
        <h2
          className={`font-display text-display-lg font-bold leading-[0.95] ${
            phase.accent ? "text-accent-blue" : ""
          }`}
        >
          {phase.title}
        </h2>
        <p
          className={`mt-4 max-w-md text-sm leading-relaxed text-muted md:text-base ${
            left ? "" : "md:ml-auto"
          } mx-auto md:mx-0`}
        >
          {phase.sub}
        </p>
      </motion.div>

      {/* Lignes techniques : des chips vers la monture (centre du cadre) */}
      <svg
        aria-hidden
        className="absolute inset-0 hidden h-full w-full md:block"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        fill="none"
      >
        <motion.polyline
          points={left ? "80,42 68,42 58,50" : "20,42 32,42 42,50"}
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="0.14"
          style={{ pathLength: draw }}
        />
        <motion.polyline
          points={left ? "78,72 66,72 57,58" : "22,72 34,72 43,58"}
          stroke="rgba(77,140,255,0.5)"
          strokeWidth="0.14"
          style={{ pathLength: draw }}
        />
        <motion.circle
          cx={left ? 58 : 42}
          cy={50}
          r={0.45}
          fill="var(--accent-blue)"
          style={{ opacity: draw }}
        />
        <motion.circle
          cx={left ? 57 : 43}
          cy={58}
          r={0.45}
          fill="var(--accent-blue)"
          style={{ opacity: draw }}
        />
      </svg>

      {/* Chips techniques ancrées (côté opposé au titre) */}
      <SpecChip
        label={phase.specs[0]}
        className={left ? "left-auto right-[4vw] top-[40vh]" : "left-[4vw] top-[40vh]"}
      />
      <SpecChip
        label={phase.specs[1]}
        className={left ? "left-auto right-[5vw] top-[70vh]" : "left-[5vw] top-[70vh]"}
      />

      {/* Cartouche de plan — micro-annotation mono */}
      <p
        className={`absolute bottom-[7vh] hidden font-mono text-[10px] uppercase tracking-[0.3em] text-white/40 md:block ${
          left ? "left-[6vw]" : "right-[6vw]"
        }`}
      >
        {phase.note}
      </p>
    </motion.div>
  );
}

function RailTick({
  label,
  index,
  total,
  progress,
}: {
  label: string;
  index: number;
  total: number;
  progress: MotionValue<number>;
}) {
  const [a, b, c, d] = phaseWindow(index, total);
  const active = useTransform(progress, [a, b, c, d], [0.35, 1, 1, index === total - 1 ? 1 : 0.35]);
  return (
    <motion.span
      style={{ opacity: active }}
      className="relative pl-4 font-mono text-[10px] tracking-[0.2em] text-white"
    >
      <span className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-current opacity-80" />
      {label}
    </motion.span>
  );
}

function SpecChip({ label, className }: { label: string; className?: string }) {
  return (
    <div
      className={`absolute hidden items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 backdrop-blur-sm md:flex ${className ?? ""}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-accent-blue" />
      <span className="font-mono text-xs tracking-wide text-white/80">{label}</span>
    </div>
  );
}
