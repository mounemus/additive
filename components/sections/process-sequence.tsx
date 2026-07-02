"use client";

import { useState } from "react";
import { ScanFace, PenTool, Layers, Sparkles, Glasses } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { FadeIn } from "@/components/motion/fade-in";
import { GenerativeBackground } from "@/components/motion/generative-bg";

const STEPS = [
  { id: "scan", label: "SCAN", icon: ScanFace, body: "Analyse morphologique du visage, calibrée au millimètre." },
  { id: "design", label: "DESIGN", icon: PenTool, body: "Adaptation paramétrique de la géométrie à vos mesures." },
  { id: "print", label: "PRINT", icon: Layers, body: "Frittage laser du nylon PA12, couche par couche." },
  { id: "finish", label: "FINISH", icon: Sparkles, body: "Dépoudrage, teinte et finition contrôlée à la main." },
  { id: "wear", label: "WEAR", icon: Glasses, body: "Montée, contrôlée, livrée — prête à être portée." },
];

export function ProcessSequence({ videoSrc = "/videos/print-layers.mp4" }: { videoSrc?: string }) {
  const reduce = useReducedMotion();
  const [videoOk, setVideoOk] = useState(true);

  // On n'affiche une vidéo de fond QUE si une vidéo personnalisée est définie
  // (CMS) — l'ancien rendu « fil de fer » naïf (print-layers) est retiré.
  const showVideo = !reduce && videoOk && !!videoSrc && !videoSrc.includes("print-layers");

  return (
    <section className="section-dark relative overflow-hidden py-14 md:py-20">
      {/* Fond : texture matière générée (Nano Banana) + lattice abstrait */}
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center opacity-45"
        style={{ backgroundImage: "url(/images/bg/matter-neutral.png)" }}
      />
      {showVideo && (
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-40"
          src={videoSrc}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
          onError={() => setVideoOk(false)}
        />
      )}
      <GenerativeBackground className="absolute inset-0 h-full w-full opacity-25" color="77,140,255" density={40} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b0d10] via-transparent to-[#0b0d10]" />

      <div className="container relative">
        <div className="grid items-end gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <FadeIn>
              <p className="eyebrow mb-4">Du visage à l’objet</p>
            </FadeIn>
            <FadeIn delay={0.1}>
              <h2 className="font-display text-display-lg font-bold leading-[0.95]">
                Scan. Design. <span className="text-accent-blue">Print.</span> Finish. Wear.
              </h2>
            </FadeIn>
          </div>
          <FadeIn delay={0.2}>
            <p className="leading-relaxed text-muted lg:text-right">
              Une chaîne numérique continue, du repère facial à la monture finie.
              Cinq étapes, aucune sous-traitée à l’à-peu-près.
            </p>
          </FadeIn>
        </div>

        <div className="mt-8 grid gap-px overflow-hidden rounded-3xl border border-border bg-border md:grid-cols-5">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="group relative bg-surface/90 p-7 backdrop-blur-sm"
            >
              <span className="font-display text-xs font-bold text-accent-blue">
                {String(i + 1).padStart(2, "0")}
              </span>
              <step.icon className="mt-5 h-7 w-7 text-foreground transition-transform duration-500 group-hover:scale-110" />
              <p className="mt-5 font-display text-lg font-bold tracking-wide">{step.label}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
