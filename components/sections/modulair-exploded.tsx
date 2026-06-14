"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { FadeIn } from "@/components/motion/fade-in";

/**
 * Vue éclatée animée MODUL'AIR : au défilement, la monture se décompose en
 * modules (face, verres, branches) puis se réassemble. Section haute avec
 * visuel pinné. Respecte prefers-reduced-motion (rendu éclaté statique).
 */
export function ModulairExploded() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  // 0 (assemblé) → 1 (éclaté) → 0 (réassemblé)
  const p = useTransform(scrollYProgress, [0.1, 0.5, 0.9], [0, 1, 0]);

  const lLensX = useTransform(p, (v) => -70 * v);
  const lLensY = useTransform(p, (v) => -170 * v);
  const rLensX = useTransform(p, (v) => 70 * v);
  const rLensY = useTransform(p, (v) => -170 * v);
  const lBranchX = useTransform(p, (v) => -300 * v);
  const rBranchX = useTransform(p, (v) => 300 * v);
  const bridgeY = useTransform(p, (v) => 150 * v);
  const labelOpacity = useTransform(p, [0, 0.4, 1], [0, 0, 1]);

  const fixed = reduce ? 1 : undefined;

  return (
    <section ref={ref} className="section-dark relative h-[240vh]">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="container">
          <FadeIn>
            <p className="eyebrow mb-3">MODUL’AIR — système modulaire</p>
            <h2 className="max-w-2xl font-display text-display-md font-bold">
              Une monture. <span className="text-accent-blue">Des modules.</span>
            </h2>
            <p className="mt-3 max-w-md text-sm text-muted">
              Faites défiler : la monture se décompose en composants
              interchangeables, puis se réassemble.
            </p>
          </FadeIn>

          <svg viewBox="0 0 1000 560" className="mt-4 w-full" role="img" aria-label="Vue éclatée d'une monture modulaire">
            {/* Branche gauche */}
            <motion.g style={reduce ? { x: -300 } : { x: lBranchX }}>
              <rect x="40" y="250" width="240" height="22" rx="11" fill="none" stroke="#9aa0a8" strokeWidth="6" />
              <circle cx="285" cy="261" r="9" fill="#4d8cff" />
              <Label x={120} y={230} opacity={fixed ?? labelOpacity}>Branche gauche</Label>
            </motion.g>

            {/* Branche droite */}
            <motion.g style={reduce ? { x: 300 } : { x: rBranchX }}>
              <rect x="720" y="250" width="240" height="22" rx="11" fill="none" stroke="#9aa0a8" strokeWidth="6" />
              <circle cx="715" cy="261" r="9" fill="#4d8cff" />
              <Label x={820} y={230} opacity={fixed ?? labelOpacity}>Branche droite</Label>
            </motion.g>

            {/* Verre gauche */}
            <motion.g style={reduce ? { x: -70, y: -170 } : { x: lLensX, y: lLensY }}>
              <rect x="305" y="210" width="170" height="140" rx="46" fill="rgba(120,170,255,0.12)" stroke="#f3f2ed" strokeWidth="9" />
              <Label x={390} y={195} opacity={fixed ?? labelOpacity}>Verre</Label>
            </motion.g>

            {/* Verre droit */}
            <motion.g style={reduce ? { x: 70, y: -170 } : { x: rLensX, y: rLensY }}>
              <rect x="525" y="210" width="170" height="140" rx="46" fill="rgba(120,170,255,0.12)" stroke="#f3f2ed" strokeWidth="9" />
            </motion.g>

            {/* Face avant (pont) */}
            <motion.g style={reduce ? { y: 150 } : { y: bridgeY }}>
              <path d="M 475 280 C 490 262, 510 262, 525 280" fill="none" stroke="#ff5a36" strokeWidth="10" strokeLinecap="round" />
              <Label x={500} y={330} opacity={fixed ?? labelOpacity} anchor="middle">Face avant</Label>
            </motion.g>
          </svg>
        </div>
      </div>
    </section>
  );
}

function Label({
  x,
  y,
  children,
  opacity,
  anchor = "start",
}: {
  x: number;
  y: number;
  children: string;
  opacity: number | import("framer-motion").MotionValue<number>;
  anchor?: "start" | "middle";
}) {
  return (
    <motion.text
      x={x}
      y={y}
      style={{ opacity }}
      textAnchor={anchor}
      fontFamily="var(--font-space-grotesk), sans-serif"
      fontSize="15"
      letterSpacing="2"
      fill="#9aa0a8"
    >
      {children.toUpperCase()}
    </motion.text>
  );
}
