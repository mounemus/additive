"use client";

import { useEffect, useRef } from "react";

/**
 * Fond génératif léger (lattice de points dérivants reliés) — pour habiller les
 * sections sans les surcharger. Très faible opacité, respecte
 * prefers-reduced-motion (rendu statique). Couleur = currentColor du conteneur.
 */
export function GenerativeBackground({
  className,
  color = "31,111,255",
  density = 46,
  linkDist = 150,
}: {
  className?: string;
  color?: string; // "r,g,b"
  density?: number;
  linkDist?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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

    const pts = Array.from({ length: density }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0004,
      vy: (Math.random() - 0.5) * 0.0004,
    }));

    function frame() {
      if (!running || !canvas || !ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const ld = linkDist * dpr;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > 1) p.vx *= -1;
        if (p.y < 0 || p.y > 1) p.vy *= -1;
      }
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        const ax = a.x * w;
        const ay = a.y * h;
        ctx.fillStyle = `rgba(${color},0.5)`;
        ctx.fillRect(ax, ay, 1.4 * dpr, 1.4 * dpr);
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j];
          const bx = b.x * w;
          const by = b.y * h;
          const d = Math.hypot(ax - bx, ay - by);
          if (d < ld) {
            ctx.strokeStyle = `rgba(${color},${0.18 * (1 - d / ld)})`;
            ctx.lineWidth = dpr * 0.6;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.stroke();
          }
        }
      }
      if (!reduce) raf = requestAnimationFrame(frame);
    }
    frame();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [color, density, linkDist]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
