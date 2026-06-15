"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import { Loader2 } from "lucide-react";

/**
 * Fil rouge animé piloté au scroll — une VRAIE monture 3D (React Three Fiber)
 * tourne, s'agrandit et se met en lumière au fil du défilement, avec des
 * légendes par phase. R3F importé dynamiquement (ssr:false).
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

export function ScrollThread({ modelUrl }: { modelUrl?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => (progressRef.current = v));

  const cap1 = useTransform(scrollYProgress, [0.02, 0.1, 0.22, 0.3], [0, 1, 1, 0]);
  const cap2 = useTransform(scrollYProgress, [0.32, 0.4, 0.5, 0.58], [0, 1, 1, 0]);
  const cap3 = useTransform(scrollYProgress, [0.6, 0.68, 0.76, 0.84], [0, 1, 1, 0]);
  const cap4 = useTransform(scrollYProgress, [0.86, 0.93, 1, 1], [0, 1, 1, 1]);

  return (
    <section ref={ref} className="section-dark relative h-[360vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Scène 3D plein cadre */}
        <div className="absolute inset-0">
          <Glasses3D progressRef={progressRef} modelUrl={modelUrl} />
        </div>
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(70% 70% at 50% 50%, transparent, rgba(11,13,16,0.55))" }}
        />

        {/* Légendes par phase */}
        <div className="pointer-events-none absolute inset-x-0 top-[14vh] flex flex-col items-center px-6 text-center">
          <Caption opacity={cap1} eyebrow="01 — Conception" title="Conçue autour de vous." />
          <Caption opacity={cap2} eyebrow="02 — Modularité" title="Une géométrie. Des modules." />
          <Caption opacity={cap3} eyebrow="03 — Fabrication" title="Imprimée couche par couche." />
          <Caption opacity={cap4} eyebrow="04 — Identité" title="Conçues pour vous." accent />
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs uppercase tracking-[0.3em] text-muted">
          Défilez
        </div>
      </div>
    </section>
  );
}

function Caption({
  opacity,
  eyebrow,
  title,
  accent,
}: {
  opacity: import("framer-motion").MotionValue<number>;
  eyebrow: string;
  title: string;
  accent?: boolean;
}) {
  return (
    <motion.div style={{ opacity }} className="absolute max-w-3xl">
      <p className="eyebrow mb-3">{eyebrow}</p>
      <h2 className={`font-display text-display-lg font-bold leading-[0.95] ${accent ? "text-accent-blue" : ""}`}>
        {title}
      </h2>
    </motion.div>
  );
}
