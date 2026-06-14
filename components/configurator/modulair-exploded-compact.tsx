"use client";

import { motion, useTime, useTransform, useReducedMotion, type MotionValue } from "framer-motion";

/**
 * Vue éclatée MODUL'AIR compacte et AUTO-ANIMÉE (sans scroll) — pour les fiches
 * produit. Les modules s'écartent puis se réassemblent en boucle continue.
 * Respecte prefers-reduced-motion (rendu éclaté statique).
 */
export function ModulairExplodedCompact({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const time = useTime();
  // Oscillation douce 0 → 1 → 0 (~5,5 s par cycle).
  const p = useTransform(time, (t) => (reduce ? 1 : (1 - Math.cos((t / 2750) * Math.PI)) / 2));

  const lLensX = useTransform(p, (v) => -55 * v);
  const lLensY = useTransform(p, (v) => -140 * v);
  const rLensX = useTransform(p, (v) => 55 * v);
  const rLensY = useTransform(p, (v) => -140 * v);
  const lBranchX = useTransform(p, (v) => -260 * v);
  const rBranchX = useTransform(p, (v) => 260 * v);
  const bridgeY = useTransform(p, (v) => 130 * v);

  return (
    <div className={className}>
      <svg viewBox="0 0 1000 520" className="h-full w-full" role="img" aria-label="Vue éclatée modulaire animée">
        <Branch side="left" x={lBranchX} />
        <Branch side="right" x={rBranchX} />
        <Lens x={lLensX} y={lLensY} rx={305} />
        <Lens x={rLensX} y={rLensY} rx={525} />
        <motion.path
          style={{ y: bridgeY }}
          d="M 475 270 C 490 252, 510 252, 525 270"
          fill="none"
          stroke="#ff5a36"
          strokeWidth="10"
          strokeLinecap="round"
        />
      </svg>
      <p className="mt-3 text-center text-xs uppercase tracking-[0.25em] text-muted">
        Face · branches · verres — interchangeables
      </p>
    </div>
  );
}

function Lens({ x, y, rx }: { x: MotionValue<number>; y: MotionValue<number>; rx: number }) {
  return (
    <motion.rect
      style={{ x, y }}
      x={rx}
      y={200}
      width="170"
      height="140"
      rx="46"
      fill="rgba(31,111,255,0.10)"
      stroke="currentColor"
      strokeWidth="9"
    />
  );
}

function Branch({ side, x }: { side: "left" | "right"; x: MotionValue<number> }) {
  const bx = side === "left" ? 40 : 720;
  const cx = side === "left" ? 285 : 715;
  return (
    <motion.g style={{ x }}>
      <rect x={bx} y={250} width="240" height="22" rx="11" fill="none" stroke="#9aa0a8" strokeWidth="6" />
      <circle cx={cx} cy={261} r="9" fill="#1f6fff" />
    </motion.g>
  );
}
