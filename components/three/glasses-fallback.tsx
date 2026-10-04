"use client";

import { withBase } from "@/lib/base-path";
import Image from "next/image";
import { Component, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Repli visuel élégant quand la scène 3D ne peut pas s'afficher
 * (WebGL indisponible, GLB en échec, petit écran) : rendu produit +
 * lignes techniques animées façon plan d'atelier. Jamais de vide.
 */
export function GlassesFallback({ imageSrc = "/images/editorial/hero-frame.png" }: { imageSrc?: string }) {
  const reduce = useReducedMotion();
  return (
    <div aria-hidden className="relative h-full w-full overflow-hidden">
      <Image
        src={withBase(imageSrc)}
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-center opacity-80"
      />
      {/* Vignette pour asseoir la lisibilité des légendes */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 70% at 50% 45%, transparent 30%, rgba(11,13,16,0.72) 100%)",
        }}
      />
      {/* Plan technique : cadre de visée + axes + cotes */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        fill="none"
      >
        <motion.path
          d="M12 20 H4 V12 M88 20 H96 V12 M12 80 H4 V88 M88 80 H96 V88"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="0.25"
          initial={reduce ? undefined : { pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
        <motion.line
          x1="8"
          y1="50"
          x2="92"
          y2="50"
          stroke="rgba(77,140,255,0.4)"
          strokeWidth="0.18"
          strokeDasharray="1.4 1.8"
          initial={reduce ? undefined : { pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, delay: 0.15, ease: "easeOut" }}
        />
        <motion.line
          x1="50"
          y1="12"
          x2="50"
          y2="88"
          stroke="rgba(77,140,255,0.28)"
          strokeWidth="0.18"
          strokeDasharray="1.4 1.8"
          initial={reduce ? undefined : { pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, delay: 0.25, ease: "easeOut" }}
        />
      </svg>
      <span className="absolute bottom-[10vh] left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.3em] text-white/45">
        Nylon PA12 — SLS
      </span>
    </div>
  );
}

/**
 * Error boundary local : si le GLB / WebGL jette (réseau, décodeur, GPU),
 * on bascule sur le repli au lieu de laisser un canvas vide.
 */
export class SceneErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** Détection WebGL synchrone (appelée côté client uniquement). */
export function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}
