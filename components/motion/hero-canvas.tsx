"use client";

import { useEffect, useRef } from "react";

/**
 * Fond génératif du hero : champ de vecteurs (flow-field) tracé en continu.
 * Hérité du principe "additive-motion" du configurateur WordPress —
 * un repli génératif élégant en attendant la vidéo cinématique de marque.
 * Respecte prefers-reduced-motion (rendu statique).
 */
export function HeroCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let running = true;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
    }
    resize();
    window.addEventListener("resize", resize);

    const N = 90;
    const particles = Array.from({ length: N }, (_, i) => ({
      x: Math.random(),
      y: Math.random(),
      hue: i % 3,
    }));

    function field(x: number, y: number, t: number) {
      return (
        Math.sin(x * 3.1 + t * 0.00012) * 1.4 +
        Math.cos(y * 2.7 - t * 0.00009) * 1.2 +
        Math.sin((x + y) * 1.8) * 0.6
      );
    }

    const colors = ["31,111,255", "255,106,42", "216,216,212"];

    function step(t: number) {
      if (!running || !canvas || !ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = "rgba(8,8,8,0.045)";
      ctx.fillRect(0, 0, w, h);

      for (const p of particles) {
        const a = field(p.x * 4, p.y * 4, t) * Math.PI;
        const speed = 0.0009;
        const nx = p.x + Math.cos(a) * speed;
        const ny = p.y + Math.sin(a) * speed * 0.8;
        ctx.strokeStyle = `rgba(${colors[p.hue]},0.35)`;
        ctx.lineWidth = dpr * 0.8;
        ctx.beginPath();
        ctx.moveTo(p.x * w, p.y * h);
        ctx.lineTo(nx * w, ny * h);
        ctx.stroke();
        p.x = nx;
        p.y = ny;
        if (p.x < -0.02 || p.x > 1.02 || p.y < -0.02 || p.y > 1.02) {
          p.x = Math.random();
          p.y = Math.random();
        }
      }
      raf = requestAnimationFrame(step);
    }

    ctx.fillStyle = "#080808";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (reduce) {
      // Rendu statique : quelques itérations sans animation.
      for (let i = 0; i < 240; i++) step(i * 16);
      running = false;
    } else {
      raf = requestAnimationFrame(step);
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
