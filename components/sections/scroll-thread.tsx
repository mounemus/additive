"use client";

import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent, useReducedMotion } from "framer-motion";

/**
 * Fil rouge animé piloté au scroll — une monture filaire unique traverse toute
 * la séquence : elle se CONSTRUIT, TOURNE en 3D, s'ÉCLATE en modules, puis
 * s'IMPRIME couche par couche et se pose de face.
 *
 * 100 % procédural (Canvas 2D, géométrie 3D projetée) — aucun modèle externe,
 * léger, fiable, mobile-friendly. Repli statique en prefers-reduced-motion.
 */

type P3 = { x: number; y: number; z: number };
type Poly = { pts: P3[]; part: "left" | "right" | "bridge" | "templeL" | "templeR" | "detail" };

function ring(cx: number, rx: number, ry: number, n: number): P3[] {
  const pts: P3[] = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push({ x: cx + Math.cos(a) * rx, y: Math.sin(a) * ry, z: Math.sin(a * 2) * 6 });
  }
  return pts;
}

function buildModel(): Poly[] {
  const polys: Poly[] = [];
  polys.push({ pts: ring(-95, 72, 60, 56), part: "left" });
  polys.push({ pts: ring(95, 72, 60, 56), part: "right" });
  // détails lattice dans les verres
  for (const cx of [-95, 95] as const) {
    for (let k = -2; k <= 2; k++) {
      polys.push({
        pts: [
          { x: cx - 60, y: k * 18, z: 0 },
          { x: cx + 60, y: k * 18, z: 0 },
        ],
        part: cx < 0 ? "left" : "right",
      });
    }
  }
  // pont
  polys.push({
    pts: [
      { x: -25, y: -10, z: 4 },
      { x: -8, y: -22, z: 8 },
      { x: 8, y: -22, z: 8 },
      { x: 25, y: -10, z: 4 },
    ],
    part: "bridge",
  });
  // branches (vont vers l'arrière en -z)
  polys.push({ pts: [ { x: -165, y: -6, z: 4 }, { x: -178, y: -12, z: -40 }, { x: -178, y: -8, z: -180 } ], part: "templeL" });
  polys.push({ pts: [ { x: 165, y: -6, z: 4 }, { x: 178, y: -12, z: -40 }, { x: 178, y: -8, z: -180 } ], part: "templeR" });
  return polys;
}

const MODEL = buildModel();

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function rotateY(p: P3, a: number): P3 {
  const ca = Math.cos(a), sa = Math.sin(a);
  return { x: p.x * ca + p.z * sa, y: p.y, z: -p.x * sa + p.z * ca };
}
function rotateX(p: P3, a: number): P3 {
  const ca = Math.cos(a), sa = Math.sin(a);
  return { x: p.x, y: p.y * ca - p.z * sa, z: p.y * sa + p.z * ca };
}

export function ScrollThread() {
  const ref = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progRef = useRef(0);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => (progRef.current = v));

  // Légendes par phase
  const cap1 = useTransform(scrollYProgress, [0.02, 0.1, 0.22, 0.28], [0, 1, 1, 0]);
  const cap2 = useTransform(scrollYProgress, [0.3, 0.38, 0.48, 0.55], [0, 1, 1, 0]);
  const cap3 = useTransform(scrollYProgress, [0.56, 0.64, 0.72, 0.78], [0, 1, 1, 0]);
  const cap4 = useTransform(scrollYProgress, [0.82, 0.9, 1, 1], [0, 1, 1, 1]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;
    let running = true;

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    function draw(p: number) {
      if (!canvas || !ctx) return;
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const pBuild = clamp(p / 0.25);
      const pRotate = clamp((p - 0.25) / 0.25);
      const pExplode = clamp((p - 0.5) / 0.25);
      const pPrint = clamp((p - 0.75) / 0.25);

      const angleBase = 0.7 * pBuild + 1.5 * pRotate + 1.1 * pExplode;
      const angle = angleBase * (1 - smooth(pPrint)); // revient de face à l'impression
      const tilt = -0.18 * (1 - smooth(pPrint));
      const ex = pExplode * (1 - smooth(pPrint));
      const reveal = pBuild;

      const printColor = pPrint; // 0 = filaire bleu, 1 = solide blanc
      const r = Math.round(lerp(31, 243, printColor));
      const g = Math.round(lerp(111, 242, printColor));
      const b = Math.round(lerp(255, 234, printColor));
      const lineW = lerp(1.2, 2.4, printColor) * dpr;

      const focal = 760;
      const scale = (Math.min(W, H) / 520) * 1.05;
      const cx = W / 2;
      const cy = H / 2;
      const scanY = H * (1 - clamp((pPrint - 0.1) / 0.8));

      function project(pt: P3): { x: number; y: number } {
        const persp = focal / (focal - pt.z);
        return { x: cx + pt.x * persp * scale, y: cy + pt.y * persp * scale };
      }

      function offset(pt: P3, part: Poly["part"]): P3 {
        const o = { ...pt };
        if (part === "left") { o.x -= 78 * ex; o.z += 24 * ex; }
        else if (part === "right") { o.x += 78 * ex; o.z += 24 * ex; }
        else if (part === "bridge") { o.y -= 70 * ex; }
        else if (part === "templeL") { o.x -= 150 * ex; }
        else if (part === "templeR") { o.x += 150 * ex; }
        return o;
      }

      for (const poly of MODEL) {
        const n = poly.pts.length;
        const upto = Math.max(2, Math.ceil(n * reveal));
        ctx.beginPath();
        for (let i = 0; i < Math.min(upto, n); i++) {
          let pt = offset(poly.pts[i], poly.part);
          pt = rotateY(pt, angle);
          pt = rotateX(pt, tilt);
          const s = project(pt);
          if (i === 0) ctx.moveTo(s.x, s.y);
          else ctx.lineTo(s.x, s.y);
        }
        // luminosité « imprimée » sous la ligne de balayage
        ctx.strokeStyle = `rgba(${r},${g},${b},${lerp(0.55, 0.95, printColor)})`;
        ctx.lineWidth = lineW;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.stroke();
      }

      // ligne de balayage d'impression
      if (pPrint > 0.02 && pPrint < 0.98) {
        ctx.fillStyle = "rgba(31,111,255,0.85)";
        ctx.fillRect(0, scanY - 1.5 * dpr, W, 3 * dpr);
        ctx.fillStyle = "rgba(188,212,255,0.9)";
        ctx.fillRect(0, scanY - 0.5 * dpr, W, 1 * dpr);
      }
    }

    function frame() {
      if (!running) return;
      draw(reduce ? 0.95 : progRef.current);
      raf = requestAnimationFrame(frame);
    }
    frame();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [reduce]);

  return (
    <section ref={ref} className="section-dark relative h-[420vh]">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(60% 60% at 50% 45%, transparent, rgba(11,13,16,0.6))" }} />

        <div className="container relative">
          <Caption opacity={cap1} eyebrow="01 — Conception" title="Conçue autour de vous." />
          <Caption opacity={cap2} eyebrow="02 — Modularité" title="Une géométrie. Des modules." />
          <Caption opacity={cap3} eyebrow="03 — Fabrication" title="Imprimée couche par couche." />
          <Caption opacity={cap4} eyebrow="04 — Identité" title="Pas conçues pour tout le monde. Conçues pour vous." accent />
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
    <motion.div style={{ opacity }} className="pointer-events-none absolute inset-x-0 -top-24 mx-auto max-w-2xl px-6 text-center md:-top-32">
      <p className="eyebrow mb-3">{eyebrow}</p>
      <h2 className={`font-display text-display-md font-bold leading-[1] ${accent ? "text-accent-blue" : ""}`}>{title}</h2>
    </motion.div>
  );
}
